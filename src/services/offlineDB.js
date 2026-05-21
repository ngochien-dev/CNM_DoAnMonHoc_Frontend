/**
 * offlineDB.js
 * IndexedDB wrapper cho Offline/Sync feature.
 *
 * Object Stores:
 *  - messages:        Cache tin nhắn theo roomId
 *  - pendingMessages: Hàng đợi tin nhắn chờ gửi khi offline
 *  - roomMeta:        Metadata phòng (lastSyncedAt, v.v.)
 */

const DB_NAME = 'OTT_OfflineDB';
const DB_VERSION = 1;

let _db = null;

/**
 * Mở (hoặc tái sử dụng) kết nối IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // --- Store: messages ---
            if (!db.objectStoreNames.contains('messages')) {
                const msgStore = db.createObjectStore('messages', { keyPath: 'messageId' });
                msgStore.createIndex('by_room', 'roomId', { unique: false });
                msgStore.createIndex('by_createdAt', 'createdAt', { unique: false });
                msgStore.createIndex('by_room_createdAt', ['roomId', 'createdAt'], { unique: false });
            }

            // --- Store: pendingMessages ---
            if (!db.objectStoreNames.contains('pendingMessages')) {
                const pendStore = db.createObjectStore('pendingMessages', { keyPath: 'tempId' });
                pendStore.createIndex('by_room', 'roomId', { unique: false });
                pendStore.createIndex('by_queuedAt', 'queuedAt', { unique: false });
            }

            // --- Store: roomMeta ---
            if (!db.objectStoreNames.contains('roomMeta')) {
                db.createObjectStore('roomMeta', { keyPath: 'roomId' });
            }
        };

        request.onsuccess = (event) => {
            _db = event.target.result;
            _db.onversionchange = () => {
                _db.close();
                _db = null;
            };
            resolve(_db);
        };

        request.onerror = (event) => {
            console.error('[OfflineDB] Failed to open IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function txStore(db, storeName, mode = 'readonly') {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

function promisifyRequest(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ─── Messages ────────────────────────────────────────────────────────────────

const MAX_CACHED_PER_ROOM = 100;

/**
 * Cache danh sách tin nhắn của một phòng vào IndexedDB.
 * Chỉ lưu text/metadata, không lưu fileData dạng base64 để tiết kiệm dung lượng.
 * @param {string} roomId
 * @param {Array} messages
 */
export async function cacheMessages(roomId, messages) {
    try {
        const db = await openDB();
        const store = txStore(db, 'messages', 'readwrite');
        const sliced = messages.slice(-MAX_CACHED_PER_ROOM);

        for (const msg of sliced) {
            // Không lưu file base64 — chỉ lưu S3 URLs và text
            const safeMsg = {
                ...msg,
                fileData: typeof msg.fileData === 'string' && msg.fileData.startsWith('data:')
                    ? null   // bỏ base64
                    : msg.fileData ?? null,
            };
            store.put(safeMsg);
        }
    } catch (err) {
        console.warn('[OfflineDB] cacheMessages error:', err);
    }
}

/**
 * Lấy danh sách tin nhắn đã cache của một phòng.
 * @param {string} roomId
 * @returns {Promise<Array>}
 */
export async function getCachedMessages(roomId) {
    try {
        const db = await openDB();
        const store = txStore(db, 'messages', 'readonly');
        const index = store.index('by_room');
        const results = await promisifyRequest(index.getAll(IDBKeyRange.only(roomId)));
        // Sắp xếp theo createdAt tăng dần
        return (results || []).sort((a, b) => {
            if (!a.createdAt) return -1;
            if (!b.createdAt) return 1;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    } catch (err) {
        console.warn('[OfflineDB] getCachedMessages error:', err);
        return [];
    }
}

/**
 * Xóa toàn bộ cache tin nhắn của một phòng.
 * @param {string} roomId
 */
export async function clearRoomCache(roomId) {
    try {
        const db = await openDB();
        const store = txStore(db, 'messages', 'readwrite');
        const index = store.index('by_room');
        const keys = await promisifyRequest(index.getAllKeys(IDBKeyRange.only(roomId)));
        for (const key of (keys || [])) {
            store.delete(key);
        }
    } catch (err) {
        console.warn('[OfflineDB] clearRoomCache error:', err);
    }
}

// ─── Pending Messages (Queue) ─────────────────────────────────────────────────

/**
 * Thêm một tin nhắn vào hàng đợi offline.
 * @param {object} payload - dữ liệu socket gốc
 * @param {string} roomId
 * @returns {Promise<string>} tempId
 */
export async function addPendingMessage(payload, roomId) {
    try {
        const db = await openDB();
        const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const entry = {
            tempId,
            roomId,
            payload: {
                ...payload,
                // Không cache file base64 trong queue
                fileData: typeof payload.fileData === 'string' && payload.fileData.startsWith('data:')
                    ? null
                    : payload.fileData ?? null,
            },
            queuedAt: new Date().toISOString(),
            retryCount: 0,
        };
        const store = txStore(db, 'pendingMessages', 'readwrite');
        await promisifyRequest(store.add(entry));
        return tempId;
    } catch (err) {
        console.warn('[OfflineDB] addPendingMessage error:', err);
        return null;
    }
}

/**
 * Lấy tất cả tin nhắn đang trong hàng đợi.
 * @returns {Promise<Array>}
 */
export async function getPendingMessages() {
    try {
        const db = await openDB();
        const store = txStore(db, 'pendingMessages', 'readonly');
        const results = await promisifyRequest(store.getAll());
        return (results || []).sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt));
    } catch (err) {
        console.warn('[OfflineDB] getPendingMessages error:', err);
        return [];
    }
}

/**
 * Xóa một tin nhắn khỏi hàng đợi theo tempId.
 * @param {string} tempId
 */
export async function removePendingMessage(tempId) {
    try {
        const db = await openDB();
        const store = txStore(db, 'pendingMessages', 'readwrite');
        await promisifyRequest(store.delete(tempId));
    } catch (err) {
        console.warn('[OfflineDB] removePendingMessage error:', err);
    }
}

/**
 * Tăng retry count cho một pending message.
 * @param {string} tempId
 */
export async function incrementRetryCount(tempId) {
    try {
        const db = await openDB();
        const store = txStore(db, 'pendingMessages', 'readwrite');
        const entry = await promisifyRequest(store.get(tempId));
        if (entry) {
            entry.retryCount = (entry.retryCount || 0) + 1;
            await promisifyRequest(store.put(entry));
        }
    } catch (err) {
        console.warn('[OfflineDB] incrementRetryCount error:', err);
    }
}

/**
 * Xóa toàn bộ hàng đợi (dùng khi reset / logout).
 */
export async function clearPendingQueue() {
    try {
        const db = await openDB();
        const store = txStore(db, 'pendingMessages', 'readwrite');
        await promisifyRequest(store.clear());
    } catch (err) {
        console.warn('[OfflineDB] clearPendingQueue error:', err);
    }
}

// ─── Room Metadata ────────────────────────────────────────────────────────────

/**
 * Cập nhật metadata của phòng.
 * @param {string} roomId
 * @param {object} meta - { lastSyncedAt, ... }
 */
export async function updateRoomMeta(roomId, meta) {
    try {
        const db = await openDB();
        const store = txStore(db, 'roomMeta', 'readwrite');
        const existing = await promisifyRequest(store.get(roomId)) || { roomId };
        await promisifyRequest(store.put({ ...existing, ...meta, roomId }));
    } catch (err) {
        console.warn('[OfflineDB] updateRoomMeta error:', err);
    }
}

/**
 * Lấy metadata của phòng.
 * @param {string} roomId
 * @returns {Promise<object|null>}
 */
export async function getRoomMeta(roomId) {
    try {
        const db = await openDB();
        const store = txStore(db, 'roomMeta', 'readonly');
        return await promisifyRequest(store.get(roomId)) || null;
    } catch (err) {
        console.warn('[OfflineDB] getRoomMeta error:', err);
        return null;
    }
}

/**
 * Xóa toàn bộ database (khi logout).
 */
export async function clearAllOfflineData() {
    try {
        if (_db) {
            _db.close();
            _db = null;
        }
        await promisifyRequest(indexedDB.deleteDatabase(DB_NAME));
    } catch (err) {
        console.warn('[OfflineDB] clearAllOfflineData error:', err);
    }
}
