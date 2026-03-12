import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config.ts";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${SITE_URL}/play`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/leaderboard`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/skins`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];
}
