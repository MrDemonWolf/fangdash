import type { MetadataRoute } from "next";
import { basePath } from "@/lib/site.ts";

export const dynamic = "force-static";
export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "FangDash — Multiplayer Wolf Runner for Twitch",
		short_name: "FangDash",
		description:
			"A free, open-source multiplayer endless runner for Twitch. Race as a wolf, dodge obstacles, and climb the leaderboard.",
		start_url: `${basePath || ""}/`,
		scope: `${basePath || ""}/`,
		display: "standalone",
		background_color: "#091533",
		theme_color: "#0faced",
		icons: [
			{ src: `${basePath}/icons/icon-head.svg`, sizes: "any", type: "image/svg+xml" },
			{
				src: `${basePath}/icons/icon-192.png`,
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: `${basePath}/icons/icon-512.png`,
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
		],
	};
}
