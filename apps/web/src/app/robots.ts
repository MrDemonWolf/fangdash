import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/race/"] },
    sitemap: "https://fangdash.mrdemonwolf.workers.dev/sitemap.xml",
  };
}
