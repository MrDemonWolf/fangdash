import type { MetadataRoute } from "next";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "FangDash",
		short_name: "FangDash",
		description:
			"A multiplayer endless runner where players race as wolves on Twitch.",
		start_url: "/",
		display: "standalone",
		background_color: "#091533",
		theme_color: "#091533",
		orientation: "any",
		icons: [
			{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
			{
				src: "/icons/icon-512-maskable.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
