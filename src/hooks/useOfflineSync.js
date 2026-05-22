/**
 * useOfflineSync.js
 * Hook chính xử lý toàn bộ logic Offline/Sync:
 *   - Theo dõi trạng thái kết nối (online/offline)
 *   - Enqueue tin nhắn vào IndexedDB khi offline
 *   - Flush queue và sync messages mới khi online trở lại
 *
 * Sử dụng trong ChatPage.jsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import useIndexedDB from './useIndexedDB';

const MAX_RETRY = 3;
const FLUSH_DELAY_MS = 1500; // Chờ socket ổn định trước khi flush

/**
 * @param {object} params
 * @param {object}   params.socket        - Socket.io instance
 * @param {object}   params.user          - Current user session
 * @param {Function} params.setMessages   - React setter cho messages state
 * @param {string}   params.activeRoomId  - ID phòng đang mở
 * @param {Function} params.onSyncComplete - Callback sau khi sync xong (optional)
 */
const useOfflineSync = ({
    socket,
    user,
    setMessages,
    activeRoomId,
    onSyncComplete,
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    // 'idle' | 'syncing' | 'synced' | 'error'
    const [syncStatus, setSyncStatus] = useState('idle');

    const isFlushing = useRef(false);
    const flushTimerRef = useRef(null);

    const {
        enqueuePendingMessage,
        loadPendingMessages,
        dequeuePendingMessage,
        retryPendingMessage,
        loadCachedMessages,
        saveMessages,
        saveRoomMeta,
    } = useIndexedDB();

    // ─── Refresh pending count ────────────────────────────────────────────────

    const refreshPendingCount = useCallback(async () => {
        const pending = await loadPendingMessages();
        setPendingCount(pending.length);
    }, [loadPendingMessages]);

    // ─── Flush pending queue ──────────────────────────────────────────────────

    /**
     * Gửi lại tất cả tin nhắn trong hàng đợi offline.
     */
    const flushPendingQueue = useCallback(async () => {
        if (isFlushing.current) return;
        if (!socket?.connected) return;

        const pending = await loadPendingMessages();
        if (pending.length === 0) return;

        isFlushing.current = true;
        setSyncStatus('syncing');

        let sentCount = 0;
        let failedCount = 0;

        for (const item of pending) {
            if (item.retryCount >= MAX_RETRY) {
                // Đã vượt quá số lần retry — bỏ qua
                await dequeuePendingMessage(item.tempId);
                failedCount++;
                continue;
            }

            try {
                // Gửi qua socket — thêm tempId để track
                socket.emit('send_message', {
                    ...item.payload,
                    _tempId: item.tempId,
                });

                // Thêm vào UI ngay lập tức dưới dạng "đang gửi"
                setMessages((prev) => {
                    // Nếu đã có tempId này (từ optimistic update trước đó) thì không thêm
                    if (prev.some((m) => m._tempId === item.tempId)) return prev;
                    return [
                        ...prev,
                        {
                            messageId: item.tempId,
                            _tempId: item.tempId,
                            _isPending: true,
                            ...item.payload,
                            createdAt: item.queuedAt,
                        },
                    ];
                });

                // Xóa khỏi queue sau khi emit
                await dequeuePendingMessage(item.tempId);
                sentCount++;
            } catch (err) {
                console.warn('[OfflineSync] Failed to flush message:', item.tempId, err);
                await retryPendingMessage(item.tempId);
                failedCount++;
            }
        }

        isFlushing.current = false;
        await refreshPendingCount();

        if (failedCount > 0) {
            setSyncStatus('error');
            toast.error(`${failedCount} tin nhắn không thể gửi lại.`);
        } else if (sentCount > 0) {
            setSyncStatus('synced');
        } else {
            setSyncStatus('idle');
        }
    }, [socket, loadPendingMessages, dequeuePendingMessage, retryPendingMessage, setMessages, refreshPendingCount]);

    // ─── Online handler ───────────────────────────────────────────────────────

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setSyncStatus('syncing');

        toast('🟢 Đã kết nối lại mạng! Đang đồng bộ...', {
            style: {
                borderRadius: '10px',
                background: '#1e293b',
                color: '#4ade80',
                fontWeight: '600',
            },
            duration: 3000,
        });

        // Chờ socket reconnect ổn định rồi mới flush
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(() => {
            flushPendingQueue().then(() => {
                if (onSyncComplete) onSyncComplete();
            });
        }, FLUSH_DELAY_MS);
    }, [flushPendingQueue, onSyncComplete]);

    // ─── Offline handler ──────────────────────────────────────────────────────

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setSyncStatus('idle');

        toast('🔴 Mất kết nối mạng. Tin nhắn sẽ được lưu lại.', {
            style: {
                borderRadius: '10px',
                background: '#1e293b',
                color: '#f87171',
                fontWeight: '600',
            },
            duration: 5000,
        });
    }, []);

    // ─── Browser events ───────────────────────────────────────────────────────

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        };
    }, [handleOnline, handleOffline]);

    // ─── Socket reconnect trigger ─────────────────────────────────────────────

    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
            flushTimerRef.current = setTimeout(() => {
                flushPendingQueue().then(() => {
                    if (onSyncComplete) onSyncComplete();
                });
            }, FLUSH_DELAY_MS);
        };

        socket.io?.on('reconnect', handleReconnect);
        return () => {
            socket.io?.off('reconnect', handleReconnect);
        };
    }, [socket, flushPendingQueue, onSyncComplete]);

    // ─── Load pending count on mount ──────────────────────────────────────────

    useEffect(() => {
        refreshPendingCount();
    }, [refreshPendingCount]);

    // ─── API: Enqueue a message (khi offline) ─────────────────────────────────

    /**
     * Enqueue tin nhắn vào offline queue thay vì emit socket.
     * Trả về một optimistic message object để hiển thị tạm thời trong UI.
     * @param {object} payload - Dữ liệu socket.emit('send_message', payload)
     * @param {string} roomId
     * @returns {Promise<object>} - Optimistic message
     */
    const sendOfflineMessage = useCallback(async (payload, roomId) => {
        const tempId = await enqueuePendingMessage(payload, roomId);
        await refreshPendingCount();

        toast('📥 Tin nhắn đã lưu, sẽ gửi khi có mạng.', {
            icon: '⏳',
            style: {
                borderRadius: '10px',
                background: '#1e293b',
                color: '#fbbf24',
            },
            duration: 3000,
        });

        // Trả về optimistic message để ChatPage thêm vào state
        return {
            messageId: tempId,
            _tempId: tempId,
            _isPending: true,
            ...payload,
            createdAt: new Date().toISOString(),
        };
    }, [enqueuePendingMessage, refreshPendingCount]);

    // ─── API: Cache messages sau khi fetch từ server ──────────────────────────

    /**
     * Lưu danh sách tin nhắn vào IndexedDB cache sau khi fetch thành công.
     * @param {string} roomId
     * @param {Array} messages
     */
    const cacheRoomMessages = useCallback(async (roomId, messages) => {
        await saveMessages(roomId, messages);
        await saveRoomMeta(roomId, { lastSyncedAt: new Date().toISOString() });
    }, [saveMessages, saveRoomMeta]);

    /**
     * Lấy tin nhắn từ IndexedDB cache (dùng khi offline hoặc API fail).
     * @param {string} roomId
     * @returns {Promise<Array>}
     */
    const getCachedRoomMessages = useCallback(async (roomId) => {
        return await loadCachedMessages(roomId);
    }, [loadCachedMessages]);

    // ─── Resolve pending message khi server confirm ───────────────────────────

    /**
     * Gọi khi nhận được 'receive_message' từ socket để thay thế pending msg.
     * @param {object} serverMsg - Tin nhắn thật từ server
     */
    const resolvePendingMessage = useCallback((serverMsg) => {
        if (!serverMsg._tempId) return;

        // Thay optimistic message bằng message thật
        setMessages((prev) =>
            prev.map((m) =>
                m._tempId === serverMsg._tempId
                    ? { ...serverMsg, _isPending: false }
                    : m
            )
        );
    }, [setMessages]);

    return {
        isOnline,
        pendingCount,
        syncStatus,
        sendOfflineMessage,
        cacheRoomMessages,
        getCachedRoomMessages,
        flushPendingQueue,
        resolvePendingMessage,
        refreshPendingCount,
    };
};

export default useOfflineSync;
