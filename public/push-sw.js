self.addEventListener('push', (event) => {
  if (!event.data) return;

  event.waitUntil((async () => {
    const data = event.data.json();
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    if (clients.some((client) => client.visibilityState === 'visible')) return;

    await self.registration.showNotification(data.title || 'BeOnTime reminder', {
      body: data.body || 'A task reminder is due.',
      icon: '/icon.svg',
      badge: '/pwa-192x192.png',
      tag: data.tag || 'beontime-reminder',
      data: { url: data.url || '/' },
      requireInteraction: true,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const existing = clients.find((client) => client.url === url);
    if (existing) {
      await existing.focus();
      return;
    }
    await self.clients.openWindow(url);
  })());
});
