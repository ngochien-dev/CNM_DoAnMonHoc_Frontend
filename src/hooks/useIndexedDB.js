/**
 * useIndexedDB.js
 * React hook cung cấp các operations cho IndexedDB offline cache.
 * Bọc offlineDB.js và expose các hàm dễ sử dụng trong component.
 */

import { useCallback } from 'react';
import {
    cacheMessages,
    getCachedMessages,
    clearRoomCache,
    addPendingMessage,
    getPendingMessages,
    removePendingMessage,
    incrementRetryCount,
    clearPendingQueue,
    updateRoomMeta,
    getRoomMeta,
    clearAllOfflineData,
} from '../services/offlineDB';

/**
 * Hook cung cấp interface thống nhất để thao tác với IndexedDB offline storage.
 * @returns {object} Các hàm CRUD cho messages, pending queue, và room metadata
 */
const useIndexedDB = () => {
    // ─── Messages Cache ───────────────────────────────────────────────────────

    const saveMessages = useCallback(async (roomId, messages) => {
        if (!roomId || !Array.isArray(messages) || messages.length === 0) return;
        await cacheMessages(roomId, messages);
    }, []);

    const loadCachedMessages = useCallback(async (roomId) => {
        if (!roomId) return [];
        return await getCachedMessages(roomId);
    }, []);

    const deleteRoomCache = useCallback(async (roomId) => {
        if (!roomId) return;
        await clearRoomCache(roomId);
    }, []);

    // ─── Pending Message Queue ────────────────────────────────────────────────

    const enqueuePendingMessage = useCallback(async (payload, roomId) => {
        if (!payload || !roomId) return null;
        return await addPendingMessage(payload, roomId);
    }, []);

    const loadPendingMessages = useCallback(async () => {
        return await getPendingMessages();
    }, []);

    const dequeuePendingMessage = useCallback(async (tempId) => {
        if (!tempId) return;
        await removePendingMessage(tempId);
    }, []);

    const retryPendingMessage = useCallback(async (tempId) => {
        if (!tempId) return;
        await incrementRetryCount(tempId);
    }, []);

    const flushPendingQueue = useCallback(async () => {
        await clearPendingQueue();
    }, []);

    // ─── Room Metadata ────────────────────────────────────────────────────────

    const saveRoomMeta = useCallback(async (roomId, meta) => {
        if (!roomId || !meta) return;
        await updateRoomMeta(roomId, meta);
    }, []);

    const loadRoomMeta = useCallback(async (roomId) => {
        if (!roomId) return null;
        return await getRoomMeta(roomId);
    }, []);

    // ─── Cleanup ──────────────────────────────────────────────────────────────

    const clearAll = useCallback(async () => {
        await clearAllOfflineData();
    }, []);

    return {
        // Messages
        saveMessages,
        loadCachedMessages,
        deleteRoomCache,
        // Pending queue
        enqueuePendingMessage,
        loadPendingMessages,
        dequeuePendingMessage,
        retryPendingMessage,
        flushPendingQueue,
        // Room meta
        saveRoomMeta,
        loadRoomMeta,
        // Cleanup
        clearAll,
    };
};

export default useIndexedDB;
