const CACHE_NAME = 'lifeos-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao fazer cache', error);
      })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Estratégia: Network First, fallback para Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta
        const responseToCache = response.clone();
        
        // Adicionar ao cache se for uma requisição GET
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Se não encontrar no cache, retornar página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Notificações Push (FCM)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recebido', event);

  let notificationData = {
    title: 'LifeOS',
    body: 'Nova notificação do LifeOS',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'lifeos-notification',
    data: {},
    requireInteraction: false,
  };

  // Processa dados do FCM
  if (event.data) {
    try {
      const payload = event.data.json();
      
      // FCM envia dados em notification ou data
      if (payload.notification) {
        notificationData.title = payload.notification.title || notificationData.title;
        notificationData.body = payload.notification.body || notificationData.body;
        notificationData.icon = payload.notification.icon || notificationData.icon;
      }
      
      // Dados customizados
      if (payload.data) {
        notificationData.data = payload.data;
        notificationData.tag = payload.data.tag || payload.data.type || notificationData.tag;
        notificationData.requireInteraction = payload.data.requireInteraction === 'true' || false;
      }
    } catch (error) {
      // Se não for JSON, tenta como texto
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
      console.error('Erro ao processar payload FCM:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    // Ações de notificação (opcional)
    actions: notificationData.data?.actions ? JSON.parse(notificationData.data.actions) : undefined,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notificação clicada', event);
  
  event.notification.close();

  // Verifica se há ação customizada
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
              // Navega para a URL se necessário
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





