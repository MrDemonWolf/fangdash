import {
	Gamepad2,
	Layers,
	Swords,
	Target,
	Trophy,
	Tv,
	Zap,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { GAME_URL } from "@/lib/constants.ts";

function Copyright() {
	return <>{new Date().getFullYear()}</>;
}

const features = [
	{
		icon: Gamepad2,
		title: "Endless Running",
		description:
			"Jump, dodge, and dash through procedurally generated obstacle courses as a wolf.",
	},
	{
		icon: Swords,
		title: "Multiplayer Racing",
		description:
			"Race up to 4 players in real-time using WebSocket-powered rooms.",
	},
	{
		icon: Trophy,
		title: "Skins & Achievements",
		description:
			"Unlock 6 unique wolf skins and earn achievements through gameplay.",
	},
	{
		icon: Tv,
		title: "Twitch Integration",
		description:
			"Sign in with Twitch, race your chat, and show off your skins on stream.",
	},
];

const stats = [
	{ icon: Layers, value: "6", label: "Wolf Skins" },
	{ icon: Target, value: "17", label: "Achievements" },
	{ icon: Zap, value: "5", label: "Difficulty Tiers" },
];

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col overflow-hidden">
			{/* Hero */}
			<section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center">
				{/* Glow orb behind heading */}
				<div
					className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
					aria-hidden="true"
				>
					<div
						className="h-[500px] w-[700px] rounded-full opacity-15 blur-[120px]"
						style={{ background: "var(--color-fd-primary)" }}
					/>
				</div>

				<p className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium tracking-wide text-fd-muted-foreground uppercase">
					<span
						className="inline-block h-1.5 w-1.5 rounded-full"
						style={{ background: "var(--color-fd-primary)" }}
					/>
					Multiplayer Endless Runner for Twitch
				</p>

				<h1 className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight sm:text-7xl">
					Dash. Race.{" "}
					<span
						className="bg-clip-text text-transparent"
						style={{
							backgroundImage:
								"linear-gradient(135deg, var(--color-fd-primary), #06b6d4, var(--color-fd-primary))",
						}}
					>
						Dominate.
					</span>
				</h1>

				<p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-fd-muted-foreground">
					A fast-paced multiplayer endless runner where players race as wolves,
					dodging obstacles and competing for the highest score. Built for
					Twitch streamers and their communities.
				</p>

				<div className="flex flex-wrap justify-center gap-3">
					<Link
						href={`${GAME_URL}/play`}
						className="group relative inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
						style={{
							background: "var(--color-fd-primary)",
							color: "var(--color-fd-primary-foreground)",
						}}
					>
						<span className="relative z-10">Play Now</span>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon */}
						<svg
							className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
							/>
						</svg>
					</Link>
					<Link
						href="/docs"
						className="rounded-lg border border-fd-border bg-fd-card px-7 py-3 text-sm font-semibold text-fd-foreground transition-all duration-200 hover:border-fd-ring hover:bg-fd-accent"
					>
						Documentation
					</Link>
					<Link
						href="https://github.com/MrDemonWolf/fangdash"
						className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-7 py-3 text-sm font-semibold text-fd-foreground transition-all duration-200 hover:border-fd-ring hover:bg-fd-accent"
					>
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4 fill-current"
							aria-hidden="true"
						>
							<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
						</svg>
						GitHub
					</Link>
				</div>
			</section>

			{/* Stats Row */}
			<section className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-8 px-6 py-8 sm:gap-16">
				{stats.map((stat) => (
					<div key={stat.label} className="flex items-center gap-3">
						<stat.icon
							className="h-5 w-5 shrink-0"
							style={{ color: "var(--color-fd-primary)" }}
						/>
						<div className="flex items-baseline gap-1.5">
							<span className="text-2xl font-bold tabular-nums text-fd-foreground">
								{stat.value}
							</span>
							<span className="text-sm text-fd-muted-foreground">
								{stat.label}
							</span>
						</div>
					</div>
				))}
			</section>

			{/* Divider */}
			<div className="mx-auto w-full max-w-5xl border-t border-fd-border" />

			{/* Features */}
			<section className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
				{features.map((feature) => (
					<div
						key={feature.title}
						className="group rounded-xl border border-fd-border bg-fd-card p-5 transition-all duration-200 hover:border-fd-ring hover:shadow-lg"
						style={
							{
								"--tw-shadow-color":
									"color-mix(in srgb, var(--color-fd-primary) 10%, transparent)",
							} as CSSProperties
						}
					>
						<div
							className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								background:
									"color-mix(in srgb, var(--color-fd-primary) 12%, transparent)",
							}}
						>
							<feature.icon
								className="h-5 w-5"
								style={{ color: "var(--color-fd-primary)" }}
							/>
						</div>
						<h3 className="mb-2 text-sm font-semibold text-fd-foreground">
							{feature.title}
						</h3>
						<p className="text-sm leading-relaxed text-fd-muted-foreground">
							{feature.description}
						</p>
					</div>
				))}
			</section>

			{/* Footer */}
			<footer className="mt-auto border-t border-fd-border px-4 py-8 text-center text-sm text-fd-muted-foreground">
				<p>
					&copy; <Copyright /> DireWork by{" "}
					<Link
						href="https://www.mrdemonwolf.com"
						className="transition-colors hover:text-fd-foreground hover:underline"
					>
						MrDemonWolf, Inc.
					</Link>
				</p>
				<div className="mt-2 flex items-center justify-center gap-1">
					<Link
						href="/docs/legal/privacy-policy"
						className="transition-colors hover:text-fd-foreground hover:underline"
					>
						Privacy Policy
					</Link>
					<span>&middot;</span>
					<Link
						href="/docs/legal/terms-of-service"
						className="transition-colors hover:text-fd-foreground hover:underline"
					>
						Terms of Service
					</Link>
				</div>
			</footer>
		</main>
	);
}
