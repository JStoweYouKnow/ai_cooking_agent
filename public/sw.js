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
      // Force all window clients to reload and wait for navigation to complete
      return self.clients.matchAll().then(function(clients) {
        var navigationPromises = [];
        var windowClients = [];

        clients.forEach(function(client) {
          if (client.type === 'window') {
            windowClients.push(client);
            navigationPromises.push(client.navigate(client.url));
          }
        });

        return Promise.allSettled(navigationPromises).then(function(results) {
          // Log any failures but don't reject the activation
          results.forEach(function(result, index) {
            if (result.status === 'rejected') {
              var client = windowClients[index];
              var clientId = client.id || client.url || 'unknown';
              console.error('Service worker: Failed to navigate client', clientId, result.reason);
            }
          });
          // Always resolve to allow activation to complete
          return Promise.resolve();
        });
      });
    })
  );
});
