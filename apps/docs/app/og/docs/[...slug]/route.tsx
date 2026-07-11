import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPageImage, source } from "@/lib/source.ts";
import { ChangelogOgCard, loadOgFonts, OG_SIZE, OgCard } from "@/app/og/_components/og-card.tsx";
import { presetForSlug } from "@/app/og/_components/og-presets.ts";

export const revalidate = false;
export const dynamic = "force-static";

interface ChangelogInfo {
	version: string;
	date: string;
	highlights: string[];
}

// Best-effort parse of the newest changelog entry so the changelog card can
// show the version + top highlights. Tolerant of "## v1.2.0 — date" and
// "## 1.2.0 (date)"; returns null on any miss so the generic card is used.
function parseLatestChangelog(): ChangelogInfo | null {
	try {
		const filePath = path.join(process.cwd(), "content/docs/changelog.mdx");
		const raw = readFileSync(filePath, "utf-8");
		// Requires a real dotted version (v1.2.3). The changelog is currently a
		// versionless, commit-linked format ("## 2026-06-13 — …"), which won't
		// match — so the changelog page falls back to the generic OG card.
		const versionMatch = raw.match(/^##\s+v(\d+\.\d[\d.]*)\s*[–—-]\s*(.+?)\s*$/m);
		if (!versionMatch || versionMatch.index === undefined || !versionMatch[1] || !versionMatch[2])
			return null;
		const version = versionMatch[1];
		const date = versionMatch[2].trim();

		const after = raw.slice(versionMatch.index + versionMatch[0].length);
		const next = after.search(/^##\s+v\d/m);
		const section = next === -1 ? after : after.slice(0, next);

		const bulletRe = /^[-*]\s+\*\*([^*]+)\*\*/gm;
		const highlights: string[] = [];
		let m: RegExpExecArray | null;
		while ((m = bulletRe.exec(section)) !== null && highlights.length < 3) {
			if (m[1]) highlights.push(m[1].trim());
		}
		if (highlights.length === 0) return null;
		return { version, date, highlights };
	} catch {
		return null;
	}
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await params;
	// The last segment is the synthetic "image.png"; the rest is the page slug.
	const pageSlug = slug.slice(0, -1);
	const page = source.getPage(pageSlug);
	if (!page) notFound();

	const fonts = await loadOgFonts();
	const preset = presetForSlug(pageSlug);
	const isChangelog = pageSlug[0] === "changelog";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = page.data as any;
	const chips: string[] = data.ogChips ?? preset.chips;
	const eyebrow: string = data.ogEyebrow ?? preset.eyebrow;

	const fontDefs = fonts.map((f) => ({
		name: f.name,
		data: f.data,
		weight: f.weight as 400 | 500 | 700,
		style: f.style,
	}));

	if (isChangelog) {
		const cl = parseLatestChangelog();
		if (cl) {
			return new ImageResponse(
				<ChangelogOgCard version={cl.version} date={cl.date} highlights={cl.highlights} />,
				{
					...OG_SIZE,
					fonts: fontDefs,
				},
			);
		}
	}

	return new ImageResponse(
		<OgCard
			eyebrow={eyebrow}
			title={data.ogTitle ?? data.title}
			description={data.ogDescription ?? data.description}
			chips={chips}
		/>,
		{ ...OG_SIZE, fonts: fontDefs },
	);
}

export function generateStaticParams() {
	return source.getPages().map((page) => ({
		slug: getPageImage(page).segments,
	}));
}
