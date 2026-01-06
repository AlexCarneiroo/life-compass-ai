// Firebase Messaging Service Worker
// Este arquivo é necessário para o FCM funcionar em background
// IMPORTANTE: Este arquivo deve estar em public/firebase-messaging-sw.js

// Usar versão mais recente e estável do Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase (mesma do firebase.ts)
// Nota: Em produção, você pode passar isso via mensagem do cliente
const firebaseConfig = {
  apiKey: "AIzaSyA9nV0BgswCwwrezu3zBMNuyQ3QKkLzjAU",
  authDomain: "controll-v.firebaseapp.com",
  projectId: "controll-v",
  storageBucket: "controll-v.firebasestorage.app",
  messagingSenderId: "984470653646",
  appId: "1:984470653646:web:e77768ff619b66a65ade9f",
  measurementId: "G-ZPWXX02X6C"
};

// Inicializar Firebase no Service Worker
firebase.initializeApp(firebaseConfig);

// Obter instância do Firebase Messaging
const messaging = firebase.messaging();

// Handler para mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('Service Worker: Mensagem FCM recebida em background', payload);

  const notificationTitle = payload.notification?.title || 'LifeOS';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || payload.data?.type || 'lifeos-notification',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.requireInteraction === 'true' || false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notificação clicada', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let url = '/';
  
  // Define URL baseado no tipo de notificação
  if (notificationData.type === 'checkin') {
    url = '/#checkin';
  } else if (notificationData.type === 'habit' && notificationData.habitId) {
    url = '/#habits';
  } else if (notificationData.url) {
    url = notificationData.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if (client.url !== self.location.origin + url) {
                return client.navigate(url);
              }
            });
          }
        }
        // Se não tem janela aberta, abre nova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});



