const APP_CACHE = "app-shell-v1";
const ASSET_CACHE = "assets-v1";

// We’ll precache just the HTML entry and then runtime-cache everything else on first use
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(["/", "/index.html"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => ![APP_CACHE, ASSET_CACHE].includes(k)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Offline-first for navigations (SPA): serve cached index.html
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== "GET") return;

  // SPA navigations
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Same-origin static assets (js, css, images, fonts): Cache First
  if (url.origin === location.origin &&
      ["script","style","image","font"].includes(req.destination)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
  }
});
