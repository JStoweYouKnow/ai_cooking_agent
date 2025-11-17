/* Basic PWA service worker with offline fallback and caching strategies */
const CACHE_NAME = "ai-cooking-agent-v1";
const ASSETS = [
	"/",
	"/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
			),
		),
	);
	self.clients.claim();
});

// Network-first for navigation and API, cache-first for static assets
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== "GET") return;

	// Static assets: cache-first
	if (url.origin === self.location.origin && url.pathname.startsWith("/_next/")) {
		event.respondWith(
			caches.match(request).then((cached) =>
				cached ||
				fetch(request).then((resp) => {
					const respClone = resp.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
					return resp;
				}),
			),
		);
		return;
	}

	// Pages and API: network-first with cache fallback
	if (request.headers.get("accept")?.includes("text/html") || url.pathname.startsWith("/api")) {
		event.respondWith(
			fetch(request)
				.then((resp) => {
					const respClone = resp.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
					return resp;
				})
				.catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
		);
	}
});


