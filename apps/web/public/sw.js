const CACHE_APP = "fangdash-app-v2";
const CACHE_ASSETS = "fangdash-assets-v2";
const APP_SHELL = ["/", "/play", "/race", "/leaderboard", "/offline"];
const ASSET_PATHS = ["/backgrounds/", "/wolves/", "/obstacles/", "/audio/", "/icons/"];
const EXCLUDED_PATHS = ["/api/", "/trpc/"];

function isGameAsset(url) {
	const path = new URL(url).pathname;
	return ASSET_PATHS.some((prefix) => path.startsWith(prefix));
}

function isExcluded(url) {
	const path = new URL(url).pathname;
	return EXCLUDED_PATHS.some((prefix) => path.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Install — pre-cache app shell with error handling
// ---------------------------------------------------------------------------
self.addEventListener("install", (e) => {
	e.waitUntil(
		caches
			.open(CACHE_APP)
			.then((cache) => cache.addAll(APP_SHELL))
			.catch((err) => {
				console.error("[SW] Failed to cache app shell:", err);
			}),
	);
});

// ---------------------------------------------------------------------------
// Activate — clean old caches, claim clients, notify of update
// ---------------------------------------------------------------------------
self.addEventListener("activate", (e) => {
	const keep = new Set([CACHE_APP, CACHE_ASSETS]);
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
			.then(() =>
				self.clients.matchAll({ type: "window" }).then((clients) => {
					for (const client of clients) {
						client.postMessage({ type: "SW_UPDATED" });
					}
				}),
			),
	);
});

// ---------------------------------------------------------------------------
// Fetch — stale-while-revalidate for assets, network-first for pages
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (e) => {
	if (e.request.method !== "GET") return;
	if (isExcluded(e.request.url)) return;

	// Game assets: cache-first with background revalidation
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

	// Navigation requests: network-first, fallback to cache, then offline page
	if (e.request.mode === "navigate") {
		e.respondWith(
			fetch(e.request)
				.then((resp) => {
					// Cache successful navigation responses
					const clone = resp.clone();
					caches.open(CACHE_APP).then((cache) => cache.put(e.request, clone));
					return resp;
				})
				.catch(() =>
					caches
						.match(e.request)
						.then((cached) => cached || caches.match("/offline"))
						.then((resp) => resp || new Response("Offline", { status: 503 })),
				),
		);
		return;
	}

	// Other requests: network-first with cache fallback
	e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// ---------------------------------------------------------------------------
// Message listener — allow client to control SW activation
// ---------------------------------------------------------------------------
self.addEventListener("message", (e) => {
	if (e.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
