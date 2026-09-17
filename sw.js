/* Offline support: cache-first for the app shell and photos. Bump VERSION on every deploy. */
var VERSION = 'v5';
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
    // cache: 'reload' skips the browser's HTTP cache, so a new version never precaches stale files
    return cache.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })).then(function () { return self.skipWaiting(); });
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
  // Trip data: try the network first (3 s limit) so edits show up at once, fall back to the saved copy.
  if (sameOrigin && /trip-data\.json$/.test(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(function (cache) {
      var fresh = fetch(new Request('trip-data.json', { cache: 'no-cache' })).then(function (res) {
        if (res.ok) cache.put('trip-data.json', res.clone());
        return res;
      });
      var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
      return Promise.race([fresh.catch(function () {}), timeout]).then(function (res) {
        return (res && res.ok) ? res : cache.match('trip-data.json').then(function (hit) { return hit || fresh; });
      });
    }));
    return;
  }
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
