// public/sw.js
const VERSION = "v2026-01-25-02";// bumped so the fix actually replaces the poisoned cache
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

      // Cache app shell resiliently, one file at a time — cache.addAll()
      // is all-or-nothing, so a single failed resource (transient network
      // blip, a bad status code) used to fail the ENTIRE install, which
      // then keeps retrying and can trigger repeated-crash behavior.
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) await appCache.put(url, res.clone());
          } catch {
            // offline during install/update -> ignore
          }
        })
      );

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
          // Only cache a GOOD response as the app shell. This was the
          // actual bug: fetch() only throws on a true network failure, not
          // on a 404/500/etc — those still "succeed" here and used to get
          // cached as index.html, poisoning the offline fallback with a
          // broken shell that then crashes on every load (even after
          // refreshing) until the cache was manually cleared.
          if (res && res.ok) {
            const cache = await caches.open(APP_CACHE);
            cache.put("/index.html", res.clone());
          }
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