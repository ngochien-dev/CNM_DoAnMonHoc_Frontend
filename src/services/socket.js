import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/appConfig';
import { getStoredToken } from './api';

let socketInstance = null;
const SOCKET_DEBUG_FLAG = '__videoCallDebugBound';
const SOCKET_DEBUG_ENABLED =
    import.meta.env.VITE_CALL_DEBUG === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_CALL_DEBUG !== 'false');

function logSocket(message, context = {}) {
    if (!SOCKET_DEBUG_ENABLED) return;
    console.debug('[SOCKET][FRONTEND]', message, context);
}

function warnSocket(message, context = {}) {
    if (!SOCKET_DEBUG_ENABLED) return;
    console.warn('[SOCKET][FRONTEND]', message, context);
}

function describeSocket(socket = socketInstance) {
    return {
        exists: Boolean(socket),
        connected: Boolean(socket?.connected),
        active: Boolean(socket?.active),
        socketId: socket?.id || null,
        url: SOCKET_URL,
    };
}

function attachSocketDebugListeners(socket) {
    if (socket[SOCKET_DEBUG_FLAG]) return;

    socket[SOCKET_DEBUG_FLAG] = true;

    socket.on('connect', () => {
        logSocket('Connected to signaling server.', {
            socketId: socket.id,
            url: SOCKET_URL,
        });
    });

    socket.on('disconnect', (reason) => {
        warnSocket('Disconnected from signaling server.', {
            socketId: socket.id,
            reason,
        });
    });

    socket.on('connect_error', (error) => {
        warnSocket('Socket connection error.', {
            socketId: socket.id || null,
            message: error?.message || 'Unknown socket error',
        });
    });

    socket.io.on('reconnect_attempt', (attempt) => {
        logSocket('Reconnect attempt.', {
            attempt,
            socketId: socket.id || null,
        });
    });

    socket.io.on('reconnect', (attempt) => {
        logSocket('Reconnected to signaling server.', {
            attempt,
            socketId: socket.id || null,
        });
    });

    socket.io.on('reconnect_error', (error) => {
        warnSocket('Reconnect error.', {
            socketId: socket.id || null,
            message: error?.message || 'Unknown reconnect error',
        });
    });
}

function buildSocket() {
    logSocket('Creating socket instance.', {
        url: SOCKET_URL,
        hasToken: Boolean(getStoredToken()),
        hasSessionId: Boolean(getStoredSession()?.sessionId),
    });

    const socket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
            token: getStoredToken(),
        },
    });

    attachSocketDebugListeners(socket);
    return socket;
}

export function getSocket() {
    if (!socketInstance) {
        socketInstance = buildSocket();
    }

    socketInstance.auth = {
        token: getStoredToken(),
    };

    return socketInstance;
}

export function getSocketDebugSnapshot() {
    return describeSocket();
}

export function connectSocket() {
    const socket = getSocket();
    if (!socket.connected) {
        logSocket('Connecting socket.', {
            alreadyActive: socket.active,
            url: SOCKET_URL,
        });
        socket.connect();
    } else {
        logSocket('Reusing existing connected socket.', {
            socketId: socket.id,
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (!socketInstance) return;
    logSocket('Disconnecting socket instance.', {
        socketId: socketInstance.id,
    });
    socketInstance.disconnect();
    socketInstance = null;
}
