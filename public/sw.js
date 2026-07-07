// public/sw.js
const VERSION = "v2026-01-25-01";
const APP_CACHE = `app-shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;

// Keep minimal app shell here (safe to precache)
const APP_SHELL = ["/", "/index.html"];

// Add fonts here too (they are critical for PDF offline)
const FONTS = [
  "/fonts/NotoSansHebrew-Regular.ttf",
  "/fonts/NotoSansHebrew-Bold.ttf",
];

// ✅ Install: cache what we can. If offline, don't fail install.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const appCache = await caches.open(APP_CACHE);
      await appCache.addAll(APP_SHELL);

      // fonts cache: try, but don't break install if fetch fails
      const assetCache = await caches.open(ASSET_CACHE);
      await Promise.all(
        FONTS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) await assetCache.put(url, res.clone());
          } catch {
            // offline during install/update -> ignore
          }
        })
      );

      self.skipWaiting();
    })()
  );
});

// ✅ Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![APP_CACHE, ASSET_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

// ✅ Fetch strategies
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Fonts: cache-first (must work offline)
  if (sameOrigin && url.pathname.startsWith("/fonts/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // 2) HTML navigation: network-first, fallback to cached index.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(APP_CACHE);
          cache.put("/index.html", res.clone());
          return res;
        } catch {
          const cached = await caches.match("/index.html");
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // 3) Same-origin static assets (js/css/images): cache-first
  if (sameOrigin && ["script", "style", "image"].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
  }
});
