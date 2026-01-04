const CACHE_VERSION = "arslan-hub-v2.0.0";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_VERSION ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  // HTML: network first
  if(req.mode === "navigate"){
    e.respondWith(fetch(req).catch(()=>caches.match("./index.html")));
    return;
  }

  // assets: cache first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res=>{
      if(res.ok) caches.open(CACHE_VERSION).then(c=>c.put(req, res.clone()));
      return res;
    }))
  );
});
