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

// Ngăn vòng lặp 401 vô hạn: khi nhận 401, đăng xuất và đẩy về trang đăng nhập
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('[API] 401 Unauthorized — token hết hạn hoặc không hợp lệ. Đang đăng xuất...');
            localStorage.removeItem('user_session');
            // Redirect to home/login page
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;