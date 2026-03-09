self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // โค้ดนี้ทำให้แอปทำงานได้แม้เน็ตหลุดบางส่วน (ใช้ Cache)
  e.respondWith(fetch(e.request));
});