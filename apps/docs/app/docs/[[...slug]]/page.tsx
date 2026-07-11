import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageImage, source } from "@/lib/source.ts";
import { getMDXComponents } from "@/mdx-components.tsx";
import { presetForSlug } from "@/app/og/_components/og-presets.ts";
import { orgUrl, siteUrl } from "@/lib/site.ts";

interface Props {
	params: Promise<{ slug?: string[] }>;
}

const GLOBAL_KEYWORDS = [
	"FangDash",
	"multiplayer endless runner",
	"Twitch game",
	"wolf running game",
	"browser game",
	"leaderboard",
	"open source game",
	"MrDemonWolf",
];

function sectionLabel(slug: string[] | undefined): string | null {
	if (!slug || slug.length === 0) return null;
	return presetForSlug(slug).eyebrow;
}

// Truthful FAQ blocks per section, surfaced as FAQPage structured data. Kept to
// pages whose content genuinely answers these questions.
const FAQ_BY_SECTION: Record<string, Array<{ q: string; a: string }>> = {
	"getting-started": [
		{
			q: "How do I play FangDash?",
			a: "Open the game in your browser, press Space (or tap on mobile) to jump, and press again mid-air to double-jump over obstacles. Sign in with Twitch to save scores and unlock skins.",
		},
		{
			q: "Is FangDash free to play?",
			a: "Yes. FangDash is free and open source. You play it in the browser — no download, no account required to try it.",
		},
		{
			q: "Do I need a Twitch account?",
			a: "No account is needed to play solo. Signing in with Twitch saves your scores, tracks XP and achievements, and lets you race in multiplayer rooms.",
		},
	],
	multiplayer: [
		{
			q: "How many players can race in FangDash?",
			a: "Up to 4 players race in a room at once. A race starts once at least 2 players are ready, after a 3-second countdown.",
		},
		{
			q: "Is the multiplayer fair?",
			a: "Yes. Every racer sees an identical, procedurally generated course driven by a shared seed, so no one gets an easier layout.",
		},
	],
};

export default async function Page({ params }: Props) {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();

	// The compatibility shim in lib/source.ts widens page typing; body/toc/full
	// and the extended frontmatter live on page.data at runtime.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = page.data as any;
	const MDX = data.body;

	const slugPath = slug?.join("/") ?? "";
	const pageUrl = `${siteUrl}/docs/${slugPath ? `${slugPath}/` : ""}`;
	const section = sectionLabel(slug);
	const eyebrow = slug?.length ? (data.ogEyebrow ?? section) : undefined;
	const slugRoot = slug?.[0];

	const breadcrumbItems = [
		{ name: "Home", item: `${siteUrl}/` },
		{ name: "Docs", item: `${siteUrl}/docs/` },
		...(section && slug?.length ? [{ name: section, item: pageUrl }] : []),
	];

	const articleLd = {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: data.title,
		description: data.description,
		inLanguage: "en-US",
		isPartOf: { "@type": "WebSite", name: "FangDash", url: siteUrl },
		author: { "@type": "Organization", name: "MrDemonWolf, Inc.", url: orgUrl },
		publisher: { "@type": "Organization", name: "MrDemonWolf, Inc." },
		mainEntityOfPage: pageUrl,
		url: pageUrl,
	};

	const breadcrumbLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: breadcrumbItems.map((b, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: b.name,
			item: b.item,
		})),
	};

	const faqs = slugRoot && slug?.length === 1 ? FAQ_BY_SECTION[slugRoot] : undefined;
	const faqLd = faqs
		? {
				"@context": "https://schema.org",
				"@type": "FAQPage",
				mainEntity: faqs.map((f) => ({
					"@type": "Question",
					name: f.q,
					acceptedAnswer: { "@type": "Answer", text: f.a },
				})),
			}
		: null;

	return (
		<DocsPage toc={data.toc} full={data.full}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
			/>
			{faqLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
				/>
			)}
			{eyebrow ? <span className="docs-eyebrow">{eyebrow}</span> : null}
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX components={getMDXComponents()} />
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = page.data as any;
	const slugPath = slug?.join("/") ?? "";
	const pageUrl = `${siteUrl}/docs/${slugPath ? `${slugPath}/` : ""}`;
	const ogImage = getPageImage(page).url;
	const ogTitle = data.ogTitle ?? data.title;
	const ogDescription = data.ogDescription ?? data.description;
	const pageKeywords: string[] = data.keywords ?? [];
	const alt = `${ogTitle} — FangDash docs`;

	return {
		title: data.title,
		description: data.description,
		keywords: [...new Set([...pageKeywords, ...GLOBAL_KEYWORDS])],
		alternates: { canonical: pageUrl },
		openGraph: {
			type: "article",
			url: pageUrl,
			siteName: "FangDash",
			title: ogTitle,
			description: ogDescription,
			images: [{ url: ogImage, width: 1200, height: 630, alt }],
		},
		twitter: {
			card: "summary_large_image",
			site: "@mrdemonwolf",
			creator: "@mrdemonwolf",
			title: ogTitle,
			description: ogDescription,
			images: [ogImage],
		},
	};
}
