// Service Worker - Self-Unregistering
// This file exists only to unregister any old service workers

self.addEventListener('install', function(event) {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Unregister this service worker
  event.waitUntil(
    self.registration.unregister().then(function() {
      // Clear all caches
      return caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      });
    }).then(function() {
      // Force all clients to reload
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.navigate(client.url);
        });
      });
    })
  );
});
