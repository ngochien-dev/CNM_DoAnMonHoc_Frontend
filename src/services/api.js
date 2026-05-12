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
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Ngăn vòng lặp 401 vô hạn: khi nhận 401, reject ngay và không retry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc đã bị xóa — không retry
            console.warn('[API] 401 Unauthorized — bỏ qua request');
        }
        return Promise.reject(error);
    }
);

export default api;