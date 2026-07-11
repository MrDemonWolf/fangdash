import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site.ts";

export const dynamic = "force-static";
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: "*", allow: "/", disallow: ["/og/"] }],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
