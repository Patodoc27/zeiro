var CACHE = 'zeiro-v8';
var SHELL = [
  './', './index.html', './theme.css', './manifest.webmanifest',
  './app/config.js', './app/icons.js', './app/demo.js', './app/api.js',
  './app/quiz.js', './app/voz.js', './app/views.js', './app/app.js', './app/extra.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (e.request.method !== 'GET' || /supabase|pooler|auth/.test(url)) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return fetch(e.request).then(function (res) {
        if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
        return res;
      }).catch(function () { return hit; });
    })
  );
});
