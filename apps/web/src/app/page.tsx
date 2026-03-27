import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HeroBackground } from "./_components/hero-background.tsx";
import { HeroCTA } from "./_components/hero-cta.tsx";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

const stats = [
	{ value: "6", label: "Wolf Skins", color: "text-fang-cyan" },
	{ value: "5", label: "Difficulty Levels", color: "text-fang-orange" },
	{ value: "4", label: "Obstacle Types", color: "text-fang-purple" },
	{ value: "\u221E", label: "Endless Runs", color: "text-fang-gold" },
];

const features = [
	{
		icon: "\u{1F43A}",
		title: "Run",
		description: "Dodge obstacles in an endless side-scrolling world as a pixel-art wolf.",
		accent: "from-fang-cyan/20 to-transparent",
	},
	{
		icon: "\u{1F3AE}",
		title: "Race",
		description: "Challenge friends in real-time multiplayer rooms with live Twitch integration.",
		accent: "from-fang-purple/20 to-transparent",
	},
	{
		icon: "\u{1F3C6}",
		title: "Rank",
		description: "Climb the global leaderboard, unlock wolf skins, and earn achievements.",
		accent: "from-fang-gold/20 to-transparent",
	},
];

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col">
			{/* Hero */}
			<section className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-24 sm:py-32 -mt-14">
				<HeroBackground />

				<div className="relative z-10 mx-auto w-full max-w-6xl">
					<div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:justify-between">
						{/* Left: text content */}
						<div className="flex max-w-2xl flex-col gap-6">
							<Badge variant="live" className="w-fit gap-2 border-emerald-400/30 px-3 py-1 text-xs">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								LIVE MULTIPLAYER
							</Badge>

							<h1 className="text-5xl font-black uppercase tracking-tight leading-[1.05] sm:text-7xl lg:text-8xl">
								<span className="text-foreground">Race. </span>
								<span className="text-glow-cyan text-primary">Dodge.</span>
								<br />
								<span className="text-foreground">Dominate.</span>
							</h1>

							<p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
								The multiplayer endless runner for Twitch. Race{" "}
								<span className="text-foreground font-medium">your community</span> in real-time and
								climb the global leaderboard.
							</p>

							<HeroCTA />
						</div>

						{/* Right: wolf mascot */}
						<div className="hidden shrink-0 lg:flex lg:justify-end">
							<div className="relative">
								{/* Fang-slash diagonal line behind wolf */}
								<div
									className="absolute -inset-8 opacity-20"
									style={{
										background:
											"linear-gradient(135deg, transparent 40%, oklch(0.72 0.15 210 / 0.4) 50%, transparent 60%)",
									}}
								/>
								<Image
									src="/wolves/wolf-mrdemonwolf.png"
									alt="FangDash wolf mascot"
									width={240}
									height={240}
									priority={true}
									className="pixelated animate-float relative z-10 drop-shadow-[0_0_50px_rgba(15,172,237,0.35)]"
								/>
							</div>
						</div>
					</div>

					{/* Stats bar */}
					<div className="mt-20 border-t border-border/50 pt-10">
						<div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
							{stats.map(({ value, label, color }) => (
								<div key={label} className="flex flex-col gap-1.5">
									<p className={`font-mono text-4xl font-black tabular-nums sm:text-5xl ${color}`}>
										{value}
									</p>
									<p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
										{label}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="border-t border-border/30 px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<div className="mb-12 flex items-center justify-center gap-4">
						<div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
						<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							How It Works
						</h2>
						<div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
					</div>

					<div className="grid gap-6 sm:grid-cols-3">
						{features.map(({ icon, title, description, accent }) => (
							<Card
								key={title}
								className="fang-accent group border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-[var(--glow-cyan)]"
							>
								<CardContent className="relative p-6">
									{/* Gradient bg accent */}
									<div
										className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
									/>
									<div className="relative">
										<span className="mb-4 block text-3xl">{icon}</span>
										<h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
										<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/30 px-6 py-8">
				<div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:text-left">
					<p className="sm:text-left">
						© {new Date().getFullYear()} FangDash by{" "}
						<Link
							href="https://mrdemonwolf.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground transition-colors hover:text-primary"
						>
							MrDemonWolf, Inc.
						</Link>
					</p>
					<p className="self-center font-mono text-xs text-muted-foreground/50 sm:text-center">
						v{process.env["NEXT_PUBLIC_APP_VERSION"]}
						{process.env["NEXT_PUBLIC_COMMIT_SHA"] && (
							<>
								{" · "}
								{COMMIT_SHA_PATTERN.test(process.env["NEXT_PUBLIC_COMMIT_SHA"]) ? (
									<Link
										href={`https://github.com/MrDemonWolf/fangdash/commit/${process.env["NEXT_PUBLIC_COMMIT_SHA"]}`}
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-muted-foreground"
									>
										{process.env["NEXT_PUBLIC_COMMIT_SHA"]}
									</Link>
								) : (
									<span>{process.env["NEXT_PUBLIC_COMMIT_SHA"]}</span>
								)}
							</>
						)}
					</p>
					<div className="flex justify-center gap-6 self-center sm:justify-end">
						<Link
							href="https://github.com/MrDemonWolf/fangdash"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-foreground"
						>
							GitHub
						</Link>
						<Link href="/play" className="transition-colors hover:text-foreground">
							Play
						</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
