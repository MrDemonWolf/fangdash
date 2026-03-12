const CACHE = "fangdash-v1";
const APP_SHELL = ["/", "/play", "/race", "/leaderboard"];

self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener("activate", (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (e) => {
	if (e.request.method !== "GET") {
		return;
	}
	e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
