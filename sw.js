/* ===============================
   ARSLAN PRO — HUB Service Worker
   Offline cache for HUB only
=============================== */

const CACHE_VERSION = "arslan-hub-v1.0.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: precache core
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve()))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - For navigation (HTML): network-first, fallback cache
// - For static assets: cache-first, fallback network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests (your HUB site)
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Assets (css/js/png/etc): cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Cache successful GET responses
          if (req.method === "GET" && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // optional: fallback for missing assets
          return cached || Response.error();
        });
    })
  );
});
