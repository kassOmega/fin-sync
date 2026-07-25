const CACHE_NAME = "finsync-v1";
const urlsToCache = ["/", "/dashboard", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Do not cache API calls (we will handle API offline sync via IndexedDB/Zustand)
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("localhost:3000")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
