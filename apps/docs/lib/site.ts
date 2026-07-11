// Single source of truth for canonical URLs, base-path resolution, and the
// homepage SEO + social-card copy. Every SEO-facing surface (root layout,
// homepage metadata, OG image, Twitter image, sitemap, robots, JSON-LD) reads
// from here so nothing can drift.

/** Canonical production URL. FangDash docs ship to GitHub Pages under /fangdash. */
export const siteUrl = "https://mrdemonwolf.github.io/fangdash";

/** The playable game (Cloudflare Workers) and the org/repo. Single spelling so
 *  structured-data consumers never see casing drift. */
export const gameUrl = "https://fangdash.mrdemonwolf.workers.dev";
export const orgUrl = "https://github.com/MrDemonWolf";
export const repoUrl = "https://github.com/MrDemonWolf/fangdash";
export const discordUrl = "https://mrdwolf.net/discord";

/** Base path baked into the static export. Mirrors next.config.mjs exactly:
 *  `/fangdash` in a production build, empty in local dev. */
export const basePath = process.env.NODE_ENV === "production" ? "/fangdash" : "";

/** Absolute, canonical URL for a path. Used for canonical tags and JSON-LD,
 *  which must always point at the production origin. */
export function absoluteUrl(path: string): string {
	const clean = path.startsWith("/") ? path : `/${path}`;
	return `${siteUrl}${clean === "/" ? "" : clean}`;
}

/** Prefix an in-app asset (image, icon) with the deploy base path so it resolves
 *  under the GitHub Pages project sub-path. Safe in client components — the value
 *  is inlined at build time. */
export function assetPath(path: string): string {
	const clean = path.startsWith("/") ? path : `/${path}`;
	return `${basePath}${clean}`;
}

export interface RepoStats {
	stars: number | null;
	latest: string | null;
}

/** Build-time GitHub stats for the trust chips. Fetched once during the static
 *  export so the star count stays current per deploy without a client request.
 *  Any failure (rate limit, offline, no releases) falls back to null so callers
 *  drop the field instead of shipping a stale number. */
export async function getRepoStats(): Promise<RepoStats> {
	const headers = {
		Accept: "application/vnd.github+json",
		"User-Agent": "fangdash-docs",
	};
	try {
		const [repoRes, relRes] = await Promise.all([
			fetch("https://api.github.com/repos/MrDemonWolf/fangdash", { headers }),
			fetch("https://api.github.com/repos/MrDemonWolf/fangdash/releases/latest", { headers }),
		]);
		const repo = repoRes.ok ? await repoRes.json() : null;
		const rel = relRes.ok ? await relRes.json() : null;
		return {
			stars: typeof repo?.stargazers_count === "number" ? repo.stargazers_count : null,
			latest: typeof rel?.tag_name === "string" ? rel.tag_name : null,
		};
	} catch {
		return { stars: null, latest: null };
	}
}

export function formatStars(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

/**
 * Homepage / root SEO + social-card copy. Change the pitch here once and the
 * page metadata, the OG image, and the Twitter image all update together.
 * Per-page docs OG cards are driven separately by each MDX file's frontmatter
 * (see app/og/docs/[...slug]/route.tsx).
 */
export const homepageSeo = {
	/** Browser <title> and og/twitter title. Keyword-rich, ~60 chars. */
	title: "FangDash — Free Multiplayer Wolf Runner for Twitch",

	/** Full meta description for search snippets. Kept under ~160 chars. */
	description:
		"A fast, free multiplayer endless runner for Twitch streamers. Race as a wolf, dodge procedurally generated obstacles, climb the leaderboard, and challenge your chat in real time.",

	/** Shorter description for the social cards. */
	socialDescription:
		"Race as a wolf, dodge obstacles, and challenge your chat in real time. A free, open-source multiplayer endless runner built for Twitch.",

	/** OG card eyebrow pill. */
	ogEyebrow: "Free & open source · Multiplayer",

	/** OG card headline. `ogAccentWord` renders in brand cyan. */
	ogTitle: "Race your chat. Rule the leaderboard.",
	ogAccentWord: "Rule the leaderboard.",

	/** OG card supporting line. Kept short so it lands in ~2 lines. */
	ogCardDescription:
		"A browser-based multiplayer endless runner for Twitch. Sign in, race up to four wolves in real time, and climb the boards.",

	/** OG card chips. Order matters — first chips read first when cropped. */
	ogChips: ["Multiplayer racing", "Twitch login", "Skins & achievements", "Open source"],

	/** Alt text for the OG image. Describe the card, not just the brand. */
	ogImageAlt:
		"FangDash — a multiplayer endless runner for Twitch where players race as wolves, dodge obstacles, and compete on real-time leaderboards.",

	/** Homepage SEO keywords (long-tail, Twitch + game intent). */
	keywords: [
		"multiplayer endless runner for twitch",
		"twitch stream game race chat",
		"free browser wolf running game",
		"twitch integration browser game",
		"race your twitch chat game",
		"endless runner leaderboard game",
		"twitch streamer minigame",
		"open source multiplayer web game",
	],
} as const;
