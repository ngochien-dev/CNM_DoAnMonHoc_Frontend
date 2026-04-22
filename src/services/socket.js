import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/appConfig';
import { getStoredToken } from './api';

let socketInstance = null;
const SOCKET_DEBUG_FLAG = '__videoCallDebugBound';

function logSocket(message, context = {}) {
    console.debug('[SOCKET]', message, context);
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
        logSocket('Disconnected from signaling server.', {
            socketId: socket.id,
            reason,
        });
    });

    socket.on('connect_error', (error) => {
        logSocket('Socket connection error.', {
            message: error?.message || 'Unknown socket error',
        });
    });
}

function buildSocket() {
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