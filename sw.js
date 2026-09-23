const CACHE_NAME = 'meu-app-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Instalação do Service Worker e cache dos arquivos iniciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Intercepta as requisições e entrega do cache se offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
