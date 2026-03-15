"use client";

import { getLevelFromXp } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTRPC } from "@/lib/trpc.ts";

/* ------------------------------------------------------------------ */
/*  Helper: format distance as km                                      */
/* ------------------------------------------------------------------ */

function fmtKm(meters: number): string {
	return `${(meters / 1000).toFixed(1)} km`;
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                    */
/* ------------------------------------------------------------------ */

function PublicProfileSkeleton() {
	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				{/* Header skeleton */}
				<div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />

				{/* Level bar skeleton */}
				<div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					<div className="space-y-6">
						{/* Performance Matrix skeleton */}
						<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60">
							<div className="h-10 border-b border-white/10" />
							<div className="grid grid-cols-2 gap-2 p-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
								))}
							</div>
						</div>
						{/* Honor Badges skeleton */}
						<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 p-5">
							<div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/5" />
							<div className="flex flex-wrap gap-3">
								{Array.from({ length: 12 }).map((_, i) => (
									<div key={i} className="h-12 w-12 animate-pulse rounded-full bg-white/5" />
								))}
							</div>
						</div>
					</div>

					{/* Scorelines skeleton */}
					<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60">
						<div className="h-10 border-b border-white/10" />
						<div className="space-y-2 p-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
							))}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

/* ------------------------------------------------------------------ */
/*  Header Banner                                                      */
/* ------------------------------------------------------------------ */

function ProfileHeader({
	userName,
	userImage,
	skinSpriteKey,
	skinName,
	highScore,
	gamesPlayed,
}: {
	userName: string;
	userImage: string | null | undefined;
	skinSpriteKey: string | null;
	skinName: string | null;
	highScore: number;
	gamesPlayed: number;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
			{/* Subtle grid overlay */}
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						"linear-gradient(rgba(15,172,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(15,172,237,0.4) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			<div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
				{/* Wolf sprite */}
				<div className="shrink-0">
					{skinSpriteKey ? (
						<div className="relative h-32 w-32">
							<Image
								src={`/wolves/${skinSpriteKey}.png`}
								alt={skinName ?? "Wolf"}
								fill={true}
								className="object-contain drop-shadow-[0_0_40px_rgba(15,172,237,0.5)]"
								style={{ imageRendering: "pixelated" }}
							/>
						</div>
					) : (
						<div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#0FACED]/20 bg-[#0FACED]/5 text-6xl">
							🐺
						</div>
					)}
				</div>

				{/* Info */}
				<div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="text-center sm:text-left">
						<h1 className="text-2xl font-bold text-white">{userName}</h1>
						<div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
							{userImage && (
								<Image
									src={userImage}
									alt={userName}
									width={20}
									height={20}
									className="rounded-full"
								/>
							)}
							<span className="text-sm text-gray-400">
								@{userName.toLowerCase().replace(/\s+/g, "")}
							</span>
						</div>
						{skinName && <p className="mt-1 text-xs text-[#0FACED]/70">Equipped: {skinName}</p>}
					</div>

					{/* Right-side badges */}
					<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
						<div className="rounded-full border border-[#0FACED]/30 bg-[#0FACED]/10 px-3 py-1">
							<span className="font-mono text-sm font-bold text-[#0FACED]">
								HI {highScore.toLocaleString()}
							</span>
						</div>
						<div className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1">
							<span className="font-mono text-sm font-bold text-purple-400">
								{gamesPlayed} RUNS
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Performance Matrix                                                 */
/* ------------------------------------------------------------------ */

interface MetricTile {
	label: string;
	value: string;
	accent: string;
}

function PerformanceMatrix({ tiles }: { tiles: MetricTile[] }) {
	return (
		<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
			<div className="border-b border-white/10 px-5 py-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
					Performance Matrix
				</h2>
			</div>
			<div className="grid grid-cols-2 gap-px bg-white/5 p-px">
				{tiles.map((tile) => (
					<div
						key={tile.label}
						className="rounded-xl border border-white/5 bg-[#0a1628] p-4 transition-all hover:border-[#0FACED]/30"
					>
						<p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
							{tile.label}
						</p>
						<p className={`font-mono text-2xl font-bold ${tile.accent}`}>{tile.value}</p>
					</div>
				))}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Honor Badges                                                       */
/* ------------------------------------------------------------------ */

interface Badge {
	icon: string;
	name: string;
	description: string;
	unlocked: boolean;
}

function HonorBadges({
	badges,
	unlockedCount,
	totalCount,
}: {
	badges: Badge[];
	unlockedCount: number;
	totalCount: number;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
			<div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Honor Badges</h2>
				<span className="font-mono text-xs text-[#0FACED]">
					{unlockedCount} / {totalCount}
				</span>
			</div>
			<div className="flex flex-wrap gap-3 p-5">
				{badges.map((badge, i) => (
					<div
						key={i}
						title={`${badge.name}: ${badge.description}`}
						className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
							badge.unlocked
								? "border-[#0FACED]/40 bg-[#0FACED]/10 shadow-[0_0_12px_rgba(15,172,237,0.2)]"
								: "border-white/10 bg-white/5 grayscale opacity-40"
						}`}
					>
						<span className="text-2xl" role="img" aria-label={badge.name}>
							{badge.unlocked ? badge.icon : "🔒"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Recent Scorelines                                                  */
/* ------------------------------------------------------------------ */

interface ScoreEntry {
	id: string;
	score: number;
	distance: number;
	obstaclesCleared: number;
	difficulty: string;
	createdAt: string | Date;
}

function TrendArrow({ trend }: { trend: "up" | "down" | "same" }) {
	if (trend === "up") {
		return <span className="font-mono text-xl font-bold text-emerald-400">↑</span>;
	}
	if (trend === "down") {
		return <span className="font-mono text-xl font-bold text-red-400">↓</span>;
	}
	return <span className="font-mono text-xl font-bold text-gray-500">—</span>;
}

function RecentScorelines({ scores }: { scores: ScoreEntry[] }) {
	const top8 = scores.slice(0, 8);

	return (
		<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
			<div className="border-b border-white/10 px-5 py-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
					Top Scores
				</h2>
			</div>

			{top8.length === 0 ? (
				<p className="px-5 py-8 text-center text-sm text-gray-500">No scores yet.</p>
			) : (
				<ul className="divide-y divide-white/5">
					{top8.map((entry, i) => {
						const next = top8[i + 1];
						const trend: "up" | "down" | "same" =
							next === undefined
								? "same"
								: entry.score > next.score
									? "up"
									: entry.score < next.score
										? "down"
										: "same";

						return (
							<li
								key={entry.id}
								className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/5"
							>
								<TrendArrow trend={trend} />
								<div className="flex flex-1 flex-col gap-0.5">
									<span className="font-mono font-bold text-white">
										{entry.score.toLocaleString()}
									</span>
									<span className="text-xs text-gray-500">
										{fmtKm(entry.distance)} · {entry.difficulty} ·{" "}
										{new Date(entry.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
								{entry.obstaclesCleared > 0 && (
									<span className="rounded-full bg-orange-400/10 px-2 py-0.5 font-mono text-xs text-orange-400">
										{entry.obstaclesCleared}
									</span>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PublicProfilePage() {
	const params = useParams();
	const id = params["id"] as string;
	const trpc = useTRPC();

	const {
		data: profile,
		isPending,
		error,
	} = useQuery(trpc.score.getPublicProfile.queryOptions({ userId: id }));

	/* ---- Loading ---- */
	if (isPending) {
		return <PublicProfileSkeleton />;
	}

	/* ---- Not found ---- */
	if (error) {
		return (
			<main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 text-4xl">
					🔍
				</div>
				<h1 className="text-xl font-bold text-white">User not found</h1>
				<p className="text-sm text-gray-400">
					This user does not exist or their profile is unavailable.
				</p>
			</main>
		);
	}

	/* ---- Private profile ---- */
	if (profile.isPrivate) {
		return (
			<main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 text-4xl">
					🔒
				</div>
				<h1 className="text-xl font-bold text-white">{profile.username}</h1>
				<p className="text-sm text-gray-400">This profile is private.</p>
			</main>
		);
	}

	/* ---- Derived values ---- */
	const { username, userImage, level, totalXp, equippedSkin, stats, topScores, achievements, skinsUnlocked } =
		profile;

	const levelInfo = getLevelFromXp(totalXp);
	const highScore = topScores.length > 0 ? (topScores[0]?.score ?? 0) : 0;

	const winRate =
		stats.racesPlayed > 0
			? `${((stats.racesWon / stats.racesPlayed) * 100).toFixed(0)}%`
			: "N/A";

	/* ---- Performance tiles ---- */
	const performanceTiles: MetricTile[] = [
		{
			label: "Total Distance",
			value: fmtKm(stats.totalDistance),
			accent: "text-[#0FACED]",
		},
		{
			label: "High Score",
			value: highScore.toLocaleString(),
			accent: "text-[#0FACED]",
		},
		{
			label: "Win Rate",
			value: winRate,
			accent: "text-emerald-400",
		},
		{
			label: "Obstacles",
			value: stats.obstaclesCleared.toLocaleString(),
			accent: "text-orange-400",
		},
		{
			label: "Games Played",
			value: stats.gamesPlayed.toLocaleString(),
			accent: "text-purple-400",
		},
		{
			label: "Total Score",
			value: stats.totalScore.toLocaleString(),
			accent: "text-yellow-400",
		},
	];

	/* ---- Honor Badges ---- */
	const unlockedBadges: Badge[] = achievements
		.filter((a) => a.unlocked)
		.map((a) => ({
			icon: a.icon,
			name: a.name,
			description: a.description,
			unlocked: true,
		}));

	const lockedBadges: Badge[] = achievements
		.filter((a) => !a.unlocked)
		.map((a) => ({
			icon: a.icon,
			name: a.name,
			description: a.description,
			unlocked: false,
		}));

	const BADGE_LIMIT = 12;
	const allBadges = [...unlockedBadges, ...lockedBadges].slice(0, BADGE_LIMIT);

	/* ---------------------------------------------------------------- */
	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				{/* Header banner */}
				<ProfileHeader
					userName={username}
					userImage={userImage}
					skinSpriteKey={equippedSkin?.spriteKey ?? null}
					skinName={equippedSkin?.name ?? null}
					highScore={highScore}
					gamesPlayed={stats.gamesPlayed}
				/>

				{/* Level & XP Progress */}
				<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 p-5 backdrop-blur-xl">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0FACED]/40 bg-[#0FACED]/10 font-mono text-lg font-bold text-[#0FACED]">
								{level}
							</span>
							<div>
								<p className="text-sm font-bold text-white">Level {level}</p>
								<p className="text-xs text-gray-400">{totalXp.toLocaleString()} XP total</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{skinsUnlocked > 0 && (
								<div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">
									<span className="font-mono text-xs font-bold text-amber-400">
										{skinsUnlocked} SKINS
									</span>
								</div>
							)}
							<p className="text-xs text-gray-500">
								{levelInfo.xpForCurrentLevel.toLocaleString()} /{" "}
								{levelInfo.xpForNextLevel.toLocaleString()} XP
							</p>
						</div>
					</div>
					<div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
						<div
							className="h-full rounded-full bg-gradient-to-r from-[#0FACED] to-purple-500 transition-all duration-500"
							style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
						/>
					</div>
				</div>

				{/* Main two-column grid */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					{/* Left: Performance Matrix + Honor Badges */}
					<div className="space-y-6">
						<PerformanceMatrix tiles={performanceTiles} />
						<HonorBadges
							badges={allBadges}
							unlockedCount={unlockedBadges.length}
							totalCount={achievements.length}
						/>
					</div>

					{/* Right: Top Scores (sticky on large screens) */}
					<div className="lg:sticky lg:top-24 lg:self-start">
						<RecentScorelines scores={topScores} />
					</div>
				</div>
			</div>
		</main>
	);
}
