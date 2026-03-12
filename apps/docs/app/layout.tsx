import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
	title: {
		default: "FangDash Docs",
		template: "%s | FangDash Docs",
	},
	description:
		"Documentation for FangDash — a multiplayer endless runner where players race as wolves on Twitch.",
	icons: {
		icon: [
			{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
		],
		apple: "/icons/icon-192.png",
	},
	openGraph: {
		title: "FangDash Docs",
		description:
			"Documentation for FangDash — a multiplayer endless runner where players race as wolves on Twitch.",
		type: "website",
		siteName: "FangDash",
		images: [
			{
				url: "/opengraph-image.png",
				width: 1200,
				height: 630,
				alt: "FangDash Docs",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "FangDash Docs",
		description:
			"Documentation for FangDash — a multiplayer endless runner where players race as wolves on Twitch.",
		images: ["/opengraph-image.png"],
	},
};

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className="flex min-h-screen flex-col">
				<RootProvider
					search={{
						enabled: false,
					}}
					theme={{
						defaultTheme: "dark",
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
