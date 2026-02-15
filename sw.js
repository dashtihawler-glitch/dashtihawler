const CACHE_NAME = 'dashti-hewler-cache-v7.4';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './shared.js',
  './dashboard.html',
  './dashboard.js',
  './assets/icon.png',
  './assets/background.jpg',
  './contracts/index.html',
  './contracts/sales.html',
  './contracts/rent.html',
  './contracts/payment.html',
  './krechi/index.html',
  './script.js',
  './taminat/index.html',
  './taminat/script.js',
  './archive/archive.html',
  './settings/settings.html',
  './settings/script.js',
  'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400;500;700&display=swap',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'
];

// Install a service worker
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        return response || fetch(event.request);
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheWhitelist.indexOf(cacheName) === -1 ? caches.delete(cacheName) : null)
    ))
  );
});

// Handle Push Notification - وەرگرتنی ئاگاداری لە سێرڤەرەوە (کاتێک ئەپەکە داخراوە)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'ئاگاداری نوێ';
  const options = {
    body: data.body || 'کرێچییەک کاتی کرێدانی هاتووە',
    icon: './assets/icon.png',
    badge: './assets/icon.png',
    vibrate: [200, 100, 200],
    tag: 'rent-notification',
    data: {
      url: data.url || './krechi/index.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle Notification Click - کردنەوەی ئەپەکە کاتێک کلیک لە ئاگاداری دەکرێت
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : './krechi/index.html';

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/krechi/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});