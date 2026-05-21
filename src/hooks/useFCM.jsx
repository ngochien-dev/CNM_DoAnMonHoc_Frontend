import React, { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../config/firebaseConfig';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook useFCM để quản lý Firebase Cloud Messaging trên frontend.
 * - Xin quyền hiển thị notification.
 * - Lấy FCM Token và gửi lên backend để lưu trữ.
 * - Lắng nghe tin nhắn khi ứng dụng đang mở ở foreground (hiển thị toast).
 * - Xóa FCM Token khi user logout.
 */
export default function useFCM(user) {
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!user?.username) {
      // Khi user logout, xóa token trên backend
      if (tokenRef.current) {
        const tokenToDelete = tokenRef.current;
        tokenRef.current = null;
        api.delete('/notifications/token', { data: { token: tokenToDelete } })
          .then(() => console.log('[FCM] Đã xóa FCM Token trên backend.'))
          .catch((err) => console.warn('[FCM] Lỗi khi xóa FCM Token:', err.message));
      }
      return;
    }

    let isMounted = true;
    let unsubscribeForeground = null;

    const setupFCM = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (!messaging) {
          console.warn('[FCM] Không lấy được messaging instance. FCM sẽ bị tắt.');
          return;
        }

        // 1. Xin quyền Notification
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') {
          console.warn('[FCM] Quyền thông báo không được cấp. Không thể nhận push notification.');
          return;
        }

        // 2. Lấy VAPID Key từ env
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.warn('[FCM] VITE_FIREBASE_VAPID_KEY rỗng. Bỏ qua lấy token (Push background sẽ không hoạt động, tin nhắn foreground vẫn hoạt động).');
        } else {
          // 3. Lấy FCM Token đăng ký thiết bị
          const token = await getToken(messaging, { vapidKey });
          if (token) {
            console.log('[FCM] FCM Token của thiết bị:', token);
            tokenRef.current = token;
            if (isMounted) {
              await api.post('/notifications/token', { token });
              console.log('[FCM] Đã gửi FCM Token lên server.');
            }
          } else {
            console.warn('[FCM] Không thể tạo FCM token. Vui lòng cấp quyền thông báo.');
          }
        }

        // 4. Lắng nghe tin nhắn khi app đang mở (Foreground)
        unsubscribeForeground = onMessage(messaging, (payload) => {
          console.log('[FCM] Nhận tin nhắn ở foreground:', payload);
          if (!isMounted) return;

          const title = payload.notification?.title || 'Thông báo mới';
          const body = payload.notification?.body || '';

          // Hiển thị toast thay vì hệ thống để tránh trùng lặp
          toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>{title}</span>
              <span style={{ fontSize: '12px', color: '#4B5563' }}>{body}</span>
            </div>
          ), {
            duration: 4000,
            position: 'top-right',
            icon: '💬',
            style: {
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }
          });
        });

      } catch (err) {
        console.error('[FCM] Lỗi cấu hình FCM:', err);
      }
    };

    setupFCM();

    return () => {
      isMounted = false;
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [user?.username]);
}
