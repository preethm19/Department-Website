// Service Worker for SMS Security
const CACHE_NAME = 'sms-cache-v1';

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept and control requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle requests to our dashboard pages
  if (url.pathname.includes('/student/dashboard.html') ||
      url.pathname.includes('/admin/dashboard.html')) {

    // Check if this is a navigation request (page load)
    if (event.request.mode === 'navigate') {
      console.log('Intercepting dashboard navigation:', url.pathname);

      // Always fetch fresh content, never from cache
      event.respondWith(
        fetch(event.request, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).catch(error => {
          console.error('Fetch failed:', error);
          // If fetch fails, return a simple response that will trigger authentication check
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta http-equiv="refresh" content="0;url=http://localhost:8080/">
              <script>
                window.location.replace('http://localhost:8080/');
              </script>
            </head>
            <body>Redirecting...</body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
      );
    }
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Clearing all caches');
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
});
