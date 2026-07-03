/* Trippa service worker — precache shell, stale-while-revalidate for data.
   Every Supabase-backed feature also has a localStorage fallback, so the
   app works fully offline and syncs on reconnect. */

const CACHE = "trippa-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // never cache API/auth calls
  if (url.pathname.startsWith("/api/")) return;

  // same-origin: stale-while-revalidate; navigation falls back to cached shell
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fresh = fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => cached || caches.match("/"));
        return cached || fresh;
      })
    );
  }
});
