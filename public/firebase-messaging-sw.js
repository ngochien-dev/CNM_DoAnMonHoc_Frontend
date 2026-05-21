// Import Firebase compat libraries inside Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase Configuration (Public client web app config)
const firebaseConfig = {
  apiKey: "AIzaSyCVfsd6JHoFNXxhx4LJlB9yJAFmw5Fli_Q",
  authDomain: "cnm-ott.firebaseapp.com",
  projectId: "cnm-ott",
  storageBucket: "cnm-ott.firebasestorage.app",
  messagingSenderId: "72413984990",
  appId: "1:72413984990:web:a62e58d7715baf09aeaa4f",
  measurementId: "G-6XM0KCF3GY"
};

// Initialize Firebase App in SW
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Nhận tin nhắn trong background:', payload);

  const title = payload.notification?.title || 'Tin nhắn mới';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.data?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    // Gắn dữ liệu đi kèm (như roomId) vào notification để xử lý lúc click
    data: payload.data, 
    tag: payload.data?.roomId || 'ott-notification',
    renotify: true
  };

  self.registration.showNotification(title, options);
});

// Xử lý khi người dùng click vào thông báo push
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Người dùng click notification:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data;
  const roomId = data?.roomId;

  if (!roomId) return;

  const targetUrl = `/?roomId=${roomId}`;

  // Tìm xem tab ứng dụng có đang mở hay không
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu có tab đang mở, điều hướng / focus vào tab đó
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Gửi tin nhắn điều hướng qua client
          client.postMessage({ type: 'NAVIGATE_ROOM', roomId });
          return client.focus();
        }
      }
      // Nếu không có tab nào đang mở, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
