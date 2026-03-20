"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		navigator.serviceWorker
			.register("/sw.js", { scope: "/" })
			.then((reg) => {
				// Check for updates hourly
				setInterval(() => reg.update(), 60 * 60 * 1000);

				// Listen for new SW installing
				reg.addEventListener("updatefound", () => {
					const installing = reg.installing;
					if (!installing) return;

					installing.addEventListener("statechange", () => {
						if (installing.state !== "installed") return;
						if (!navigator.serviceWorker.controller) return;

						// New SW is waiting — prompt user to reload
						toast("A new version of FangDash is available!", {
							duration: Infinity,
							action: {
								label: "Reload",
								onClick: () => {
									installing.postMessage({ type: "SKIP_WAITING" });
									window.location.reload();
								},
							},
						});
					});
				});
			})
			.catch((err) => {
				console.error("[SW] Registration failed:", err);
			});

		// Listen for SW_UPDATED messages from the service worker
		const onMessage = (event: MessageEvent) => {
			if (event.data?.type === "SW_UPDATED") {
				console.log("[SW] Service worker updated");
			}
		};
		navigator.serviceWorker.addEventListener("message", onMessage);
		return () => navigator.serviceWorker.removeEventListener("message", onMessage);
	}, []);

	return null;
}
