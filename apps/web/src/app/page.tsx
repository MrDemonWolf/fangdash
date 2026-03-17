import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "./_components/hero-background.tsx";
import { HeroCTA } from "./_components/hero-cta.tsx";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

const stats = [
	{ value: "6", label: "Wolf Skins" },
	{ value: "5", label: "Difficulties" },
	{ value: "4", label: "Obstacle Types" },
	{ value: "\u221E", label: "Endless Runs" },
];

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col">
			{/* Hero */}
			<section className="relative flex flex-1 flex-col justify-center px-6 py-24 sm:py-32 overflow-hidden -mt-14">
				<HeroBackground />

				<div className="relative z-10 mx-auto w-full max-w-6xl">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-16">
						{/* Left: text content */}
						<div className="flex flex-col gap-6 max-w-2xl">
							<Badge variant="outline" className="w-fit gap-2 px-3 py-1 text-xs border-primary/30">
								<span className="size-1.5 rounded-full bg-primary animate-pulse" />
								LIVE MULTIPLAYER
							</Badge>

							<h1 className="text-5xl font-bold tracking-tight leading-[1.1] sm:text-7xl">
								<span className="text-foreground">Run. Race.</span>
								<br />
								<span className="text-primary">Dominate.</span>
							</h1>

							<p className="text-base text-muted-foreground sm:text-lg max-w-md leading-relaxed">
								The multiplayer endless runner for Twitch. Race{" "}
								<span className="text-foreground">your community</span> in real-time and climb the
								global leaderboard.
							</p>

							<HeroCTA />
						</div>

						{/* Right: wolf mascot */}
						<div className="hidden lg:flex justify-end shrink-0">
							<Image
								src="/wolves/wolf-mrdemonwolf.png"
								alt="FangDash wolf mascot"
								width={220}
								height={220}
								priority={true}
								className="animate-float drop-shadow-[0_0_40px_rgba(15,172,237,0.3)]"
								style={{ imageRendering: "pixelated" }}
							/>
						</div>
					</div>

					{/* Stats bar */}
					<div className="mt-20 border-t border-border pt-10">
						<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
							{stats.map(({ value, label }) => (
								<div key={label} className="flex flex-col gap-1">
									<p className="font-mono text-4xl font-semibold text-foreground sm:text-5xl tabular-nums">
										{value}
									</p>
									<p className="text-xs font-medium text-muted-foreground tracking-wide">{label}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border px-6 py-8">
				<div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:text-left">
					<p className="sm:text-left">
						© {new Date().getFullYear()} FangDash by{" "}
						<Link
							href="https://mrdemonwolf.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:text-primary transition-colors"
						>
							MrDemonWolf, Inc.
						</Link>
					</p>
					<p className="font-mono text-xs text-muted-foreground/50 sm:text-center self-center">
						v{process.env["NEXT_PUBLIC_APP_VERSION"]}
						{process.env["NEXT_PUBLIC_COMMIT_SHA"] &&
							COMMIT_SHA_PATTERN.test(process.env["NEXT_PUBLIC_COMMIT_SHA"]) && (
								<>
									{" · "}
									<Link
										href={`https://github.com/MrDemonWolf/fangdash/commit/${process.env["NEXT_PUBLIC_COMMIT_SHA"]}`}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:text-muted-foreground transition-colors"
									>
										{process.env["NEXT_PUBLIC_COMMIT_SHA"]}
									</Link>
								</>
							)}
					</p>
					<div className="flex justify-center gap-6 sm:justify-end self-center">
						<Link
							href="https://github.com/MrDemonWolf/fangdash"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground transition-colors"
						>
							GitHub
						</Link>
						<Link href="/play" className="hover:text-foreground transition-colors">
							Play
						</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
