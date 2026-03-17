"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pwa-banner-dismissed";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
	const [visible, setVisible] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (localStorage.getItem(STORAGE_KEY) === "true") return;

		const isMobileOrTablet = /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent);
		if (!isMobileOrTablet) return;

		const ua = navigator.userAgent;
		const ios =
			/iphone|ipad|ipod/i.test(ua) &&
			!(window.navigator as Navigator & { standalone?: boolean }).standalone;

		if (ios) {
			setIsIOS(true);
			setVisible(true);
			return;
		}

		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setVisible(true);
		};

		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") {
			dismiss();
		}
		setDeferredPrompt(null);
	};

	const dismiss = () => {
		setVisible(false);
		try {
			localStorage.setItem(STORAGE_KEY, "true");
		} catch {
			// ignore
		}
	};

	if (!visible) return null;

	return (
		<div
			className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 animate-in slide-in-from-bottom-4 duration-300"
			role="banner"
			aria-label="Install FangDash"
		>
			<div className="w-full max-w-md rounded-xl border border-primary/30 bg-card shadow-2xl">
				<div className="flex items-start gap-3 p-4">
					<span className="text-2xl" aria-hidden="true">
						🐺
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-foreground">
							Install FangDash for the best experience
						</p>
						{isIOS ? (
							<p className="mt-1 text-xs text-muted-foreground">
								Tap <span className="text-primary">Share</span> →{" "}
								<span className="text-primary">Add to Home Screen</span>
							</p>
						) : (
							<p className="mt-1 text-xs text-muted-foreground">
								Add to your home screen for the full game experience
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={dismiss}
						aria-label="Dismiss install banner"
						className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
					>
						<X className="size-4" />
					</button>
				</div>
				{!isIOS && deferredPrompt && (
					<div className="flex gap-2 border-t border-border px-4 pb-4 pt-3">
						<Button variant="secondary" size="sm" className="flex-1" onClick={dismiss}>
							Not Now
						</Button>
						<Button size="sm" className="flex-1" onClick={handleInstall}>
							Install →
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
