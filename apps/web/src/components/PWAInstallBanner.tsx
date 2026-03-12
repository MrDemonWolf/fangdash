"use client";

import { useEffect, useState } from "react";

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
    // Don't show if already dismissed
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    // Detect iOS (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    // Chrome/Android: listen for the install prompt
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
      <div className="w-full max-w-md rounded-xl border border-[#0FACED]/30 bg-[#091533] shadow-2xl">
        <div className="flex items-start gap-3 p-4">
          <span className="text-2xl" aria-hidden="true">🐺</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm">
              Install FangDash for the best experience
            </p>
            {isIOS ? (
              <p className="mt-1 text-xs text-white/50">
                Tap <span className="text-[#0FACED]">Share</span> → <span className="text-[#0FACED]">Add to Home Screen</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-white/50">
                Add to your home screen for the full game experience
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="shrink-0 rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 border-t border-[#0FACED]/10 px-4 pb-4 pt-3">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white/70"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 rounded-lg bg-[#0FACED] px-4 py-2 text-xs font-bold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
            >
              Install →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
