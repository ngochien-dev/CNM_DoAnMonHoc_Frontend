import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/appConfig';
import { getStoredSession, getStoredToken } from './api';

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

export function buildSocketAuth() {
    const token = getStoredToken();
    const session = getStoredSession();
    return {
        token,
        sessionId: session?.sessionId || null,
    };
}

export function describeAuth(auth = {}) {
    const token = auth.token || '';
    return {
        hasToken: Boolean(token),
        tokenLength: token.length,
        tokenPreview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : null,
        sessionId: auth.sessionId || null,
        hasSessionId: Boolean(auth.sessionId),
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
            auth: describeAuth(socket.auth),
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
    const auth = buildSocketAuth();

    const socket = io(SOCKET_URL, {
        autoConnect: false,
        auth,
    });

    logSocket('Creating socket instance.', {
        url: SOCKET_URL,
        transports: 'default',
        auth: describeAuth(auth),
    });

    attachSocketDebugListeners(socket);
    return socket;
}

export function getSocket() {
    if (!socketInstance) {
        socketInstance = buildSocket();
    }

    const auth = buildSocketAuth();
    socketInstance.auth = auth;

    logSocket('Refreshing socket auth.', {
        socketId: socketInstance.id || null,
        connected: socketInstance.connected,
        active: socketInstance.active,
        auth: describeAuth(auth),
    });

    return socketInstance;
}

export function getSocketDebugSnapshot() {
    return describeSocket();
}

export function connectSocket() {
    const socket = getSocket();
    if (!socket.connected) {
        socket.auth = buildSocketAuth();

        logSocket('Connecting socket.', {
            alreadyActive: socket.active,
            url: SOCKET_URL,
            auth: describeAuth(socket.auth),
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
