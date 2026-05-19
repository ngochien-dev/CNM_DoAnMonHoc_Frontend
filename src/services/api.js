import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';

export function getStoredSession() {
    try {
        const rawSession = localStorage.getItem('user_session');
        return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
        return null;
    }
}

export function getStoredToken() {
    return getStoredSession()?.token || null;
}

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const session = getStoredSession();
    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
    }
    if (session?.sessionId) {
        config.headers['x-session-id'] = session.sessionId;
    }
    return config;
});

export default api;
