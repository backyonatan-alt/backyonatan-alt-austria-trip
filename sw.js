/* Offline support: cache-first for the app shell and photos. Bump VERSION on every deploy. */
var VERSION = 'v1';
var CACHE = 'austria-trip-' + VERSION;
var SHELL = [
  './', 'index.html', 'tokens.css', 'styles.css', 'app.js', 'trip-data.json', 'manifest.webmanifest',
  'icon.svg', 'icon-180.png', 'icon-512.png',
  'bricolage-600.woff2', 'bricolage-800.woff2',
  'nunito-400.woff2', 'nunito-600.woff2',
  'nunito-700.woff2', 'nunito-800.woff2'
];

function photoList(data) {
  var local = data.trip.photoSource === 'local', out = [];
  data.bases.forEach(function (b) { var u = local ? b.heroPhoto : b.heroPhotoUrl; if (u) out.push(u); });
  data.places.forEach(function (p) { var u = local ? p.photo : p.photoUrl; if (u) out.push(u); });
  return out;
}
// Photos are fetched one at a time so the image host does not rate-limit the burst.
function cachePhotos(cache, urls) {
  return urls.reduce(function (chain, url) {
    return chain.then(function () {
      var remote = /^https?:/.test(url);
      return fetch(new Request(url, remote ? { mode: 'no-cors' } : {})).then(function (res) {
        if (res.ok || res.type === 'opaque') return cache.put(url, res);
      }).catch(function () {});
    });
  }, Promise.resolve());
}

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL).then(function () { return self.skipWaiting(); });
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('austria-trip-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }).then(function () {
      // Photos in the background; tell the page once everything is saved.
      caches.open(CACHE).then(function (cache) {
        return cache.match('trip-data.json').then(function (r) { return r.json(); }).then(function (data) {
          return cachePhotos(cache, photoList(data));
        }).then(function () {
          return cache.put('__precached', new Response('ok'));
        }).then(function () {
          return self.clients.matchAll().then(function (list) { list.forEach(function (c) { c.postMessage({ type: 'offline-ready' }); }); });
        });
      }).catch(function () {});
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var isPhoto = /(^|\.)wikimedia\.org$/.test(url.hostname);
  if (!sameOrigin && !isPhoto) return;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    // ?date= and friends must still hit the cached page
    return cache.match(req, { ignoreSearch: sameOrigin && req.mode === 'navigate' }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return cache.match('index.html');
        return Response.error();
      });
    });
  }));
});
