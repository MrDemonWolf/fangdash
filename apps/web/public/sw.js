const CACHE_APP = "fangdash-app-v1";
const CACHE_ASSETS = "fangdash-assets-v1";
const APP_SHELL = ["/", "/play", "/race", "/leaderboard"];
const ASSET_PATHS = ["/backgrounds/", "/wolves/", "/obstacles/", "/audio/", "/icons/"];

function isGameAsset(url) {
	const path = new URL(url).pathname;
	return ASSET_PATHS.some((prefix) => path.startsWith(prefix));
}

self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE_APP).then((c) => c.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener("activate", (e) => {
	const keep = new Set([CACHE_APP, CACHE_ASSETS]);
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (e) => {
	if (e.request.method !== "GET") return;

	if (isGameAsset(e.request.url)) {
		e.respondWith(
			caches.open(CACHE_ASSETS).then((cache) =>
				cache.match(e.request).then((cached) => {
					const fetchPromise = fetch(e.request)
						.then((resp) => {
							if (resp.ok) cache.put(e.request, resp.clone());
							return resp;
						})
						.catch(() => cached);
					return cached || fetchPromise;
				}),
			),
		);
		return;
	}

	e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
