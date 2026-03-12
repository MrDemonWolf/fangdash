import Image from "next/image";
import Link from "next/link";
import { HeroBackground } from "./_components/hero-background.tsx";
import { HeroCTA } from "./_components/hero-cta.tsx";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

const stats = [
	{ value: "6", label: "Wolf Skins" },
	{ value: "5", label: "Difficulty Levels" },
	{ value: "4", label: "Obstacle Types" },
	{ value: "\u221E", label: "Endless Runs" },
];

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function Home() {
	return (
		<main className="flex min-h-screen flex-col">
			{/* Hero */}
			<section className="relative flex flex-1 flex-col justify-center bg-[#091533] px-4 py-24 sm:py-32 overflow-hidden -mt-20">
				<HeroBackground />

				<div className="relative z-10 mx-auto w-full max-w-7xl">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
						{/* Left: text content */}
						<div className="flex flex-col gap-6 max-w-3xl">
							{/* Badge */}
							<span className="w-fit flex items-center gap-2 rounded-full border border-[#0FACED]/40 bg-[#0FACED]/10 px-4 py-1.5 text-sm font-medium text-[#0FACED]">
								<span className="h-2 w-2 rounded-full bg-[#0FACED] animate-pulse" />
								LIVE MULTIPLAYER
							</span>

							{/* Headline */}
							<h1 className="text-7xl font-extrabold tracking-tight uppercase leading-none sm:text-8xl">
								<span className="text-white block">RUN. RACE.</span>
								<span className="text-[#0FACED] italic block">DOMINATE.</span>
							</h1>

							{/* Subtitle */}
							<p className="text-lg text-gray-300 sm:text-xl max-w-xl">
								The ultimate multiplayer endless runner for Twitch streamers.
								Race <span className="text-[#0FACED]">your community</span> in
								real-time and climb the global ranks.
							</p>

							<HeroCTA />
						</div>

						{/* Right: wolf mascot */}
						<div className="flex justify-center md:justify-end shrink-0">
							<Image
								src="/wolves/wolf-mrdemonwolf.png"
								alt="FangDash wolf mascot"
								width={256}
								height={256}
								priority={true}
								className="animate-float drop-shadow-[0_0_48px_rgba(15,172,237,0.4)]"
								style={{ imageRendering: "pixelated" }}
							/>
						</div>
					</div>

					{/* Stats bar */}
					<div className="mt-16 border-t border-white/10 pt-10">
						<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
							{stats.map(({ value, label }) => (
								<div key={label} className="flex flex-col gap-1">
									<p className="font-mono text-5xl font-bold text-white sm:text-6xl">
										{value}
									</p>
									<p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
										{label}
									</p>
								</div>
							))}
						</div>

						{/* Tagline */}
						<p className="mt-10 text-lg font-bold uppercase tracking-widest text-white sm:text-xl">
							LEVEL UP <span className="text-[#0FACED]">YOUR STREAM</span>
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-white/10 bg-[#091533] px-4 py-8">
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 text-center text-sm text-gray-400 sm:grid-cols-3 sm:text-left">
					<p className="sm:text-left">
						© {new Date().getFullYear()} FangDash by{" "}
						<Link
							href="https://mrdemonwolf.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#0FACED] hover:underline"
						>
							MrDemonWolf, Inc.
						</Link>
					</p>
					<p className="font-mono text-xs text-gray-500 sm:text-center self-center">
						v{process.env.NEXT_PUBLIC_APP_VERSION}
						{process.env.NEXT_PUBLIC_COMMIT_SHA &&
							COMMIT_SHA_PATTERN.test(process.env.NEXT_PUBLIC_COMMIT_SHA) && (
								<>
									{" · "}
									<Link
										href={`https://github.com/MrDemonWolf/fangdash/commit/${process.env.NEXT_PUBLIC_COMMIT_SHA}`}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:text-white"
									>
										{process.env.NEXT_PUBLIC_COMMIT_SHA}
									</Link>
								</>
							)}
					</p>
					<div className="flex justify-center gap-6 sm:justify-end self-center">
						<Link
							href="https://github.com/MrDemonWolf/fangdash"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-white"
						>
							GitHub
						</Link>
						<Link href="/play" className="hover:text-white">
							Play
						</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
