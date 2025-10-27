self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'reply') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New message',
    icon: '/app.png',
    badge: '/app.png',
    tag: data.tag || 'chat-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'reply',
        title: 'Reply'
      }
    ],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Chat App', options)
  );
});
