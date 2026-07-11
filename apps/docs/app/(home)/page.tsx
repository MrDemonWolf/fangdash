import {
	ArrowRight,
	Code2,
	Gamepad2,
	Layers,
	Play,
	Rocket,
	Server,
	Sparkles,
	Star,
	Swords,
	Target,
	Trophy,
	Tv,
	Users,
	Wind,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	absoluteUrl,
	discordUrl,
	formatStars,
	gameUrl,
	getRepoStats,
	homepageSeo,
	repoUrl,
} from "@/lib/site.ts";
import { BackToTop } from "./_widgets/BackToTop.tsx";
import { GameHUD } from "./_widgets/GameHUD.tsx";
import { LeaderboardCard } from "./_widgets/LeaderboardCard.tsx";
import { SkinStrip } from "./_widgets/SkinStrip.tsx";

export const metadata: Metadata = {
	title: homepageSeo.title,
	description: homepageSeo.description,
	keywords: [...homepageSeo.keywords],
	alternates: { canonical: absoluteUrl("/") },
	openGraph: {
		type: "website",
		url: absoluteUrl("/"),
		siteName: "FangDash",
		title: homepageSeo.title,
		description: homepageSeo.socialDescription,
		images: [
			{
				url: absoluteUrl("/opengraph-image.png"),
				width: 1200,
				height: 630,
				alt: homepageSeo.ogImageAlt,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: "@mrdemonwolf",
		creator: "@mrdemonwolf",
		title: homepageSeo.title,
		description: homepageSeo.socialDescription,
		images: [absoluteUrl("/opengraph-image.png")],
	},
};

// GitHub mark. lucide-react dropped brand glyphs, so use the official mark.
function GithubIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	);
}

// ── Numbered section kicker — shared spine (01 · HOW TO PLAY) ──
function Kicker({ index, children }: { index: string; children: ReactNode }) {
	return (
		<span className="fd-kicker">
			<span className="fd-kicker-num">{index}</span>
			{children}
		</span>
	);
}

function CenterHead({
	index,
	kicker,
	title,
	sub,
}: {
	index: string;
	kicker: string;
	title: ReactNode;
	sub?: ReactNode;
}) {
	return (
		<div className="mx-auto max-w-3xl text-center">
			<div className="mb-5 flex justify-center">
				<Kicker index={index}>{kicker}</Kicker>
			</div>
			<h2 className="fd-display fd-text-1 text-4xl sm:text-5xl">{title}</h2>
			{sub ? <p className="fd-text-2 mt-5 text-lg leading-relaxed">{sub}</p> : null}
		</div>
	);
}

function FaqRow({ q, a }: { q: string; a: ReactNode }) {
	return (
		<details className="fd-card group" style={{ padding: "1.1rem 1.25rem" }}>
			<summary
				className="flex cursor-pointer list-none items-center justify-between gap-4"
				style={{ fontWeight: 600 }}
			>
				<span className="fd-text-1 text-base sm:text-lg">{q}</span>
				<span
					className="fd-text-2 text-2xl leading-none transition-transform group-open:rotate-45"
					aria-hidden="true"
				>
					+
				</span>
			</summary>
			<div className="fd-text-2 mt-4 text-base leading-relaxed">{a}</div>
		</details>
	);
}

const stats = [
	{ icon: Layers, value: "6", label: "Wolf skins" },
	{ icon: Trophy, value: "21", label: "Achievements" },
	{ icon: Zap, value: "5", label: "Difficulty tiers" },
	{ icon: Users, value: "4", label: "Players per race" },
];

export default async function HomePage() {
	const { stars } = await getRepoStats();
	return (
		<main
			id="nd-page"
			tabIndex={-1}
			className="fd-font fd-bg-base flex flex-1 flex-col overflow-hidden"
		>
			{/* ═══════════════ HERO ═══════════════ */}
			<section className="relative overflow-hidden">
				<div className="fd-hero-glow" aria-hidden="true" />
				<div className="fd-speedlines" aria-hidden="true">
					<span style={{ top: "22%", width: 180 }} />
					<span style={{ top: "40%", width: 120, animationDelay: "0.6s" }} />
					<span style={{ top: "63%", width: 220, animationDelay: "1.2s" }} />
					<span style={{ top: "78%", width: 90, animationDelay: "0.3s" }} />
				</div>
				<div className="relative z-10 px-6 pt-16 pb-20 sm:pt-24">
					<div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
						{/* Claim */}
						<div className="text-center lg:text-left">
							<p className="fd-reveal fd-reveal-1 fd-text-brand mb-5 text-sm font-semibold">
								Free & open source · Multiplayer endless runner
							</p>
							<h1 className="fd-reveal fd-reveal-1 fd-hero-headline fd-text-1">
								Race your chat. <span className="fd-text-brand">Rule the leaderboard.</span>
							</h1>
							<p className="fd-reveal fd-reveal-2 fd-text-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed lg:mx-0">
								FangDash is a free multiplayer endless runner for Twitch. Sign in, sprint as a wolf,
								dodge everything, and climb daily, weekly, and all-time boards — solo or against up
								to four racers in real time.
							</p>
							<div className="fd-reveal fd-reveal-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
								<Link href={`${gameUrl}/play`} className="fd-btn fd-btn-primary">
									<Play className="h-4 w-4" />
									Play now
								</Link>
								<Link href="/docs" className="fd-btn fd-btn-secondary">
									Read the docs
									<ArrowRight className="h-4 w-4" />
								</Link>
							</div>
							<p className="fd-reveal fd-reveal-3 fd-text-2 mt-4 text-sm">
								<span className="fd-text-1 font-semibold">No download</span> · Plays in your browser
							</p>
							<div className="fd-reveal fd-reveal-3 mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
								<a
									href={repoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="fd-pill"
									aria-label="View FangDash on GitHub"
								>
									<GithubIcon className="h-3 w-3" /> Open source · MIT
								</a>
								<span className="fd-pill">Sign in with Twitch</span>
								<span className="fd-pill">Built on Cloudflare</span>
							</div>
						</div>

						{/* Product cluster */}
						<div className="fd-reveal fd-reveal-2 relative mx-auto flex w-full max-w-xl flex-col items-center gap-4">
							<GameHUD />
							<div className="w-full sm:-mt-8 sm:ml-auto sm:max-w-sm">
								<LeaderboardCard compact />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ═══════════════ STATS ═══════════════ */}
			<section className="mx-auto w-full max-w-5xl px-6 py-4">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{stats.map((s) => (
						<div key={s.label} className="fd-stat">
							<s.icon className="fd-stat-icon h-5 w-5" aria-hidden="true" />
							<span className="fd-stat-value">{s.value}</span>
							<span className="fd-stat-label">{s.label}</span>
						</div>
					))}
				</div>
			</section>

			{/* ═══════════════ 01 · AUDIENCES ═══════════════ */}
			<section id="features" className="fd-bg-surface scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto max-w-6xl">
					<CenterHead
						index="01"
						kicker="Who it's for"
						title={<>One wolf. Three ways to play.</>}
						sub="A quick-hit game for a stream break, a personal-best grind, or a whole stack you host yourself."
					/>
					<div className="mt-14 grid gap-5 md:grid-cols-3">
						{[
							{
								icon: Tv,
								title: "For streamers",
								body: "Turn a stream break into a race. Viewers sign in with Twitch and challenge you on your own leaderboard — no bots, no setup.",
								href: "/docs/multiplayer/twitch",
								cta: "Twitch integration",
							},
							{
								icon: Gamepad2,
								title: "For players",
								body: "One button, endless run. Chase a new personal best across five difficulty tiers, stack game mods, and unlock six wolf skins.",
								href: "/docs/gameplay",
								cta: "How to play",
							},
							{
								icon: Server,
								title: "For self-hosters",
								body: "Own the whole stack. Deploy the game, API, and real-time race server to Cloudflare in minutes. It's open source, top to bottom.",
								href: "/docs/getting-started/self-hosting",
								cta: "Self-hosting guide",
							},
						].map(({ icon: Icon, title, body, href, cta }) => (
							<div key={title} className="fd-card fd-card-hover flex flex-col">
								<div
									className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
									style={{ background: "var(--brand-50)", color: "var(--brand-500)" }}
								>
									<Icon className="h-5 w-5" />
								</div>
								<h3 className="fd-display fd-text-1 mb-2 text-xl">{title}</h3>
								<p className="fd-text-2 flex-1 text-base leading-relaxed">{body}</p>
								<Link
									href={href}
									className="fd-text-brand mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
								>
									{cta}
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ═══════════════ 02 · GAMEPLAY ═══════════════ */}
			<section id="play" className="fd-bg-base scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 lg:gap-16">
					<div className="text-center md:text-left">
						<Kicker index="02">How to play</Kicker>
						<h2 className="fd-display fd-text-1 mt-5 text-4xl sm:text-5xl">
							One button. Total focus.
						</h2>
						<p className="fd-text-2 mt-5 text-lg leading-relaxed">
							Tap or press <code className="fd-mono fd-text-1">Space</code> to jump, again mid-air
							to double-jump, and hold for extra height. You score 10 points a second plus 50 for
							every obstacle cleared — while the speed ramps from Easy all the way to Nightmare.
						</p>
						<Link
							href="/docs/gameplay/controls"
							className="fd-text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-semibold"
						>
							Controls & scoring
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
					<div className="mx-auto w-full">
						<GameHUD />
					</div>
				</div>
			</section>

			{/* ═══════════════ 03 · MULTIPLAYER ═══════════════ */}
			<section className="fd-bg-surface scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 lg:gap-16">
					<div className="order-2 mx-auto w-full md:order-1">
						<LeaderboardCard />
					</div>
					<div className="order-1 text-center md:order-2 md:text-left">
						<Kicker index="03">Multiplayer racing</Kicker>
						<h2 className="fd-display fd-text-1 mt-5 text-4xl sm:text-5xl">
							Four wolves. One seed. No excuses.
						</h2>
						<p className="fd-text-2 mt-5 text-lg leading-relaxed">
							Up to four players race a single, procedurally generated course from the same shared
							seed — everyone sees the exact same obstacles, so wins come down to reflexes. Rival
							ghosts run alongside you, and finishing position earns bonus XP.
						</p>
						<Link
							href="/docs/multiplayer"
							className="fd-text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-semibold"
						>
							How races work
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
				</div>
			</section>

			{/* ═══════════════ 04 · UNLOCKABLES ═══════════════ */}
			<section className="fd-bg-base scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto max-w-6xl">
					<CenterHead
						index="04"
						kicker="Progression"
						title={<>Grind for glory.</>}
						sub="Every run feeds your level, unlocks skins, and chips away at achievements. Turn up the challenge with stacking game mods."
					/>
					<div className="mt-12">
						<SkinStrip />
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						<div className="fd-card fd-card-hover flex items-start gap-4">
							<div
								className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
								style={{
									background: "color-mix(in srgb, var(--gold) 16%, transparent)",
									color: "var(--gold)",
								}}
							>
								<Target className="h-5 w-5" />
							</div>
							<div>
								<h3 className="fd-text-1 text-lg font-semibold">21 achievements, 5 categories</h3>
								<p className="fd-text-2 mt-1 text-sm leading-relaxed">
									Score, distance, games played, skill, and social. Some hand you an exclusive wolf
									skin.{" "}
									<Link
										href="/docs/customization/achievements"
										className="fd-text-brand font-semibold"
									>
										See them all
									</Link>
									.
								</p>
							</div>
						</div>
						<div className="fd-card fd-card-hover flex items-start gap-4">
							<div
								className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
								style={{
									background: "color-mix(in srgb, var(--purple) 16%, transparent)",
									color: "var(--purple)",
								}}
							>
								<Wind className="h-5 w-5" />
							</div>
							<div>
								<h3 className="fd-text-1 text-lg font-semibold">
									3 game mods, stacking multipliers
								</h3>
								<p className="fd-text-2 mt-1 text-sm leading-relaxed">
									Fog, Headwind, and Tremor each add a 1.15× score bonus. Stack all three for a
									1.52× run.{" "}
									<Link href="/docs/gameplay/mods" className="fd-text-brand font-semibold">
										Read the mods
									</Link>
									.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ═══════════════ 05 · OPEN & FREE (proof band) ═══════════════ */}
			<section className="fd-bg-surface scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto max-w-5xl">
					<CenterHead
						index="05"
						kicker="Open & free"
						title={<>Free to play. Yours to fork.</>}
						sub="No paywall, no ads. Read every line on GitHub, self-host it on Cloudflare, or build your own wolf."
					/>
					<div className="fd-proof mt-12">
						<div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
							<div className="fd-play-card">
								<div>
									<p className="fd-play-eyebrow">Jump in</p>
									<p className="fd-play-headline">Free, in your browser.</p>
								</div>
								<div className="fd-play-actions">
									<Link href={`${gameUrl}/play`} className="fd-btn fd-btn-primary fd-btn-lg">
										<Play className="h-4 w-4" />
										Play FangDash
									</Link>
									<p className="fd-play-meta">
										<span>No install</span>
										<span className="fd-play-sep" aria-hidden="true">
											·
										</span>
										<span>Free forever</span>
										<span className="fd-play-sep" aria-hidden="true">
											·
										</span>
										<span>MIT licensed</span>
									</p>
									<a
										href={repoUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="fd-btn fd-btn-ghost"
									>
										<Star className="h-4 w-4" />
										{stars != null ? (
											<>
												<b className="fd-chip-strong">{formatStars(stars)}</b> · Star on GitHub
											</>
										) : (
											"Star on GitHub"
										)}
									</a>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3 sm:gap-4">
								{[
									{ Icon: Zap, value: "$0", label: "Free forever. No ads, no tiers." },
									{ Icon: Code2, value: "MIT", label: "Open source. Fork it freely." },
									{ Icon: Rocket, value: "Web", label: "Plays in any modern browser." },
									{ Icon: Server, value: "Edge", label: "Runs on Cloudflare Workers." },
								].map(({ Icon, value, label }) => (
									<div key={label} className="fd-stat">
										<Icon className="fd-stat-icon h-5 w-5" aria-hidden="true" />
										<span className="fd-stat-value">{value}</span>
										<span className="fd-stat-label">{label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
						{["Next.js", "Phaser 4", "PartyKit", "Hono + tRPC", "Cloudflare D1", "Better Auth"].map(
							(t) => (
								<span key={t} className="fd-pill">
									{t}
								</span>
							),
						)}
					</div>
				</div>
			</section>

			{/* ═══════════════ 06 · FAQ ═══════════════ */}
			<section id="faq" className="fd-bg-base scroll-mt-20 px-6 py-16 sm:py-24">
				<div className="mx-auto max-w-3xl">
					<CenterHead
						index="06"
						kicker="Questions, answered"
						title={<>Before you run.</>}
						sub="Short answers. The long ones live in the docs."
					/>
					<div className="mt-12 space-y-3">
						<FaqRow
							q="Is FangDash free?"
							a={
								<>
									Yes — free and open source under the MIT license. There are no ads, no premium
									tier, and no download. You play it right in your browser.
								</>
							}
						/>
						<FaqRow
							q="Do I need a Twitch account?"
							a={
								<>
									You can play solo without signing in. Signing in with Twitch saves your scores,
									tracks XP and achievements, unlocks skins, and lets you join multiplayer race
									rooms.
								</>
							}
						/>
						<FaqRow
							q="How many players can race together?"
							a={
								<>
									Up to four. A race starts once at least two players are ready, after a
									three-second countdown. Everyone runs the same seeded course, so it's a pure test
									of reflexes.
								</>
							}
						/>
						<FaqRow
							q="What do I control?"
							a={
								<>
									Just jumping. Tap the screen or press{" "}
									<code className="fd-mono fd-text-1">Space</code> to jump, again for a double-jump,
									and hold for a higher hop. That's the whole game — timing is everything.
								</>
							}
						/>
						<FaqRow
							q="Can I host my own copy?"
							a={
								<>
									Absolutely. FangDash is a Turborepo monorepo you can deploy to Cloudflare (web,
									API, and PartyKit race server). Follow the{" "}
									<Link
										href="/docs/getting-started/self-hosting"
										className="fd-text-brand font-semibold"
									>
										self-hosting guide
									</Link>
									.
								</>
							}
						/>
						<FaqRow
							q="Which data does FangDash store?"
							a={
								<>
									When you sign in with Twitch, it stores your Twitch profile (username, avatar, ID,
									and email) plus your scores and progress. See the{" "}
									<Link href="/docs/legal/privacy-policy" className="fd-text-brand font-semibold">
										privacy policy
									</Link>{" "}
									for the full list.
								</>
							}
						/>
					</div>
					<p className="fd-text-2 mt-10 text-center text-sm">
						More questions?{" "}
						<a
							href={discordUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="fd-text-brand font-semibold"
						>
							Ask in Discord
						</a>
						.
					</p>
				</div>
			</section>

			{/* ═══════════════ CTA ═══════════════ */}
			<section className="fd-bg-surface scroll-mt-20 px-6 py-28 sm:py-36">
				<div className="mx-auto max-w-4xl text-center">
					<div
						className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
						style={{ background: "var(--brand-50)", color: "var(--brand-500)" }}
					>
						<Swords className="h-5 w-5" />
					</div>
					<h2 className="fd-display fd-text-1 text-5xl sm:text-6xl">
						The pack is waiting.
						<br />
						<span className="fd-text-brand">Take the lead.</span>
					</h2>
					<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link href={`${gameUrl}/play`} className="fd-btn fd-btn-primary">
							<Play className="h-4 w-4" />
							Play FangDash
						</Link>
						<Link href="/docs" className="fd-btn fd-btn-secondary">
							Read the docs
							<ArrowRight className="h-4 w-4" />
						</Link>
						<a
							href={repoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="fd-btn fd-btn-ghost"
						>
							<GithubIcon className="h-4 w-4" />
							Star on GitHub
						</a>
					</div>
					<p className="fd-text-2 mt-5 flex items-center justify-center gap-2 text-sm">
						<Sparkles className="h-3.5 w-3.5" style={{ color: "var(--brand-500)" }} />
						Free · Open source · Multiplayer
					</p>
				</div>
			</section>

			<BackToTop />
		</main>
	);
}
