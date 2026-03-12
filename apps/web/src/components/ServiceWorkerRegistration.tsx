"use client";
import { useEffect } from "react";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
				setInterval(() => reg.update(), 60 * 60 * 1000);
			});
		}
	}, []);
	return null;
}
