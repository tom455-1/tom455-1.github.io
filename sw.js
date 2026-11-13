// Mes cours : réseau d'abord (les mises à jour arrivent tout de suite), cache si hors ligne.
const CACHE = 'cours-a73115d2bf';
const FILES = ["./", "./index.html", "./biocell/", "./biocell/index.html", "./enregistrer/", "./enregistrer/index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'cours-polices').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // polices Google : gardées en cache pour l'affichage hors ligne
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('cours-polices').then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(req, { signal: ctl.signal, cache: 'no-cache' });
      clearTimeout(timer);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (_) {
      return (await cache.match(req, { ignoreSearch: true })) ||
             (req.mode === 'navigate' ? await cache.match(new URL('./', req.url).href) : Response.error());
    }
  })());
});
