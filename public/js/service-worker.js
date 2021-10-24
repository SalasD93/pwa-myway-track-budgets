const CACHE_NAME = 'track_budgets_v1';
const DATA_CACHE_NAME = 'data_cache_v1';

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/idb,js',
    '/js/index.js',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// Install the service worker
self.addEventListener('install', function(event) {
    event.waitUntill(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Your files were pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Activate service worker and removed old cached data
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Intercept fetch requests of data
self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
                return fetch(event.request)
                .then(response => {
                    // Clone and store good responses
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }

                    return response;
                })
                .catch(err => {
                    return cache.match(event.request);
                });
            })
            .catch(err => console.log(err))
        );

        return;
    }

    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request).then(function(response) {
                if (response) {
                    return response;
                } else if (event.request.headers.get('accept').includes('text/html')) {
                    // return cahced homepage for all html homepages requests
                    return caches.match('/');
                }
            });
        })
    );
})