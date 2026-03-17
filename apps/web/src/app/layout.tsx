import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner.tsx";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration.tsx";
import { Navbar } from "@/components/ui/Navbar.tsx";
import { SITE_URL } from "@/lib/site-config.ts";
import { Providers } from "./providers.tsx";
import "./globals.css";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#050505",
};

export const metadata: Metadata = {
	title: "FangDash",
	description: "A multiplayer endless runner where players race as wolves on Twitch.",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "FangDash",
	},
	openGraph: {
		title: "FangDash",
		description: "A multiplayer endless runner where players race as wolves on Twitch.",
		type: "website",
		siteName: "FangDash",
		url: "/",
		images: [{ url: "/api/og", width: 1200, height: 630, alt: "FangDash" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "FangDash",
		description: "A multiplayer endless runner where players race as wolves on Twitch.",
		images: ["/api/og"],
	},
	metadataBase: new URL(SITE_URL),
	icons: {
		icon: [
			{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
		],
		apple: "/icons/icon-192.png",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
			<body className="bg-background text-foreground min-h-screen antialiased font-sans">
				<Providers>
					<ServiceWorkerRegistration />
					<Toaster position="top-right" theme="dark" richColors />
					<Navbar />
					<PWAInstallBanner />
					{children}
				</Providers>
			</body>
		</html>
	);
}
