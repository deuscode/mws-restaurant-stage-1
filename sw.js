// Service Work Cache
const swCache = 'restaurant-review-0003';

// Service Worker Listener
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(swCache)
      .then(async function(cache) {
        try 
        {
            return cache.addAll([
                '/',
                '/sw.js',
                '/index.html',
                '/restaurant.html',
                '/restaurant.html?id=1',
                '/restaurant.html?id=2',
                '/restaurant.html?id=3',
                '/restaurant.html?id=4',
                '/restaurant.html?id=5',
                '/restaurant.html?id=6',
                '/restaurant.html?id=7',
                '/restaurant.html?id=8',
                '/restaurant.html?id=9',
                '/restaurant.html?id=10',
                '/css/styles.css',
                '/js/idb.js',
                '/js/idbhelper.js',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/data/restaurants.json',
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg',
                '/img/favicon.ico',
                '/data/img/steak.png',
                '/data/manifest.json'
              ])
              .then(function() {
                return self.skipWaiting();
              })
          }
          catch (error) {
              console.log('Cache failure: ' + error);
          }
      })
  );
});

// fetch response for index.html
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') {
    event.respondWith (
      fetch(event.request.clone()).catch(function(error) {
        saveRequest(event.request.clone().url, favorite_status)
      })
    )
  } else {
      event.respondWith(
        caches.match(event.request).then(function(response) {
          return response || fetch(event.request).then(async function(fetchResponse) {
            const cache = await caches.open(swCache);
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
          });
        }).catch(function(error) {
            return new Response('Please connect to the internet to view this page', {
            status: 404,
            statusText: "No Connection..."
          });
        })
      );
    }
});

self.addEventListener('activate', function(event) {
  // activate listener on initial page load
  event.waitUntil(self.clients.claim());
});
