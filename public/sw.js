// public/sw.js

// 1) עדכן את המספר בכל דיפלוי (אפשר ידני, או תן תאריך)
const VERSION = "v2025-09-12-01"; // ← תגדיל אחד בכל דיפלוי
const APP_CACHE = `app-shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(["/", "/index.html"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![APP_CACHE, ASSET_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  // 2) network-first ל־HTML/JS/CSS
  const isDoc = req.mode === "navigate" || req.destination === "document";
  const isAsset =
    req.destination === "script" || req.destination === "style";

  if ((isDoc || isAsset) && isSameOrigin) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(ASSET_CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          // offline fallback
          const cached = await caches.match(req);
          if (cached) return cached;
          if (isDoc) return caches.match("/index.html");
          return Response.error();
        }
      })()
    );
    return;
  }

  // 3) שאר קבצים סטטיים (תמונות/פונטים) – cache-first
  if (isSameOrigin && ["image", "font"].includes(req.destination)) {
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
