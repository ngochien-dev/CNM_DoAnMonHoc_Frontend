import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp = null;

try {
  if (firebaseConfig.apiKey) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('[FCM] Firebase web app initialized successfully.');
  } else {
    console.warn('[FCM] Firebase api key is missing in environment variables. Push notifications are disabled.');
  }
} catch (error) {
  console.error('[FCM] Error initializing Firebase app:', error);
}

export { firebaseApp };

/**
 * Lấy instance messaging an toàn (kiểm tra trình duyệt có hỗ trợ không)
 * @returns {Promise<Messaging|null>}
 */
export const getMessagingInstance = async () => {
  if (!firebaseApp) return null;
  try {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(firebaseApp);
    } else {
      console.warn('[FCM] Push notifications không được hỗ trợ bởi trình duyệt này.');
    }
  } catch (err) {
    console.error('[FCM] Lỗi kiểm tra hỗ trợ Firebase Messaging:', err);
  }
  return null;
};
