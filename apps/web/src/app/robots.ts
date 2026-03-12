import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config.ts";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/race/"] },
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}
