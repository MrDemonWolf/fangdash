import { statSync } from "node:fs";
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site.ts";
import { source } from "@/lib/source.ts";

export const dynamic = "force-static";
export const revalidate = false;

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

function classify(url: string): { priority: number; changeFrequency: Freq } {
	if (url === "/") return { priority: 1.0, changeFrequency: "monthly" };
	if (url === "/docs" || url === "/docs/") return { priority: 0.9, changeFrequency: "weekly" };
	if (url.includes("/changelog")) return { priority: 0.9, changeFrequency: "weekly" };
	if (url.includes("/legal/")) return { priority: 0.4, changeFrequency: "yearly" };
	return { priority: 0.7, changeFrequency: "weekly" };
}

function abs(p: string): string {
	const clean = p.endsWith("/") ? p : `${p}/`;
	return `${siteUrl}${clean === "/" ? "/" : clean}`;
}

function mtime(absPath: string | undefined): Date {
	if (!absPath) return new Date();
	try {
		return statSync(absPath).mtime;
	} catch {
		return new Date();
	}
}

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	const staticEntries: MetadataRoute.Sitemap = [
		{ url: abs("/"), lastModified: now, ...classify("/") },
	];

	const docEntries: MetadataRoute.Sitemap = source.getPages().map((page) => ({
		url: abs(page.url),
		lastModified: mtime((page as { absolutePath?: string }).absolutePath),
		...classify(page.url),
	}));

	return [...staticEntries, ...docEntries];
}
