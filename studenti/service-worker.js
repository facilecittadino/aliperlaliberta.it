const CACHE = "ali-studenti-v4";
const SHELL = ["/studenti/", "/studenti/styles.css", "/studenti/studenti.js", "/studenti/manifest.webmanifest", "/studenti/icon-192.png", "/studenti/icon-512.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.hostname === "api.aliperlaliberta.it" || event.request.method !== "GET") return;
  if (url.pathname.startsWith("/studenti/")) event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
