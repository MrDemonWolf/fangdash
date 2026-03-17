"use client";

import { getLevelFromXp } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
				<Skeleton className="h-32 w-full rounded-2xl" />
				<Skeleton className="h-20 w-full rounded-2xl" />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<Skeleton className="h-4 w-40" />
							</CardHeader>
							<div className="grid grid-cols-2 gap-2 p-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={i} className="h-24 rounded-xl" />
								))}
							</div>
						</Card>
						<Card>
							<CardContent className="p-5">
								<Skeleton className="mb-4 h-4 w-32" />
								<div className="flex flex-wrap gap-3">
									{Array.from({ length: 12 }).map((_, i) => (
										<Skeleton key={i} className="size-12 rounded-full" />
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<div className="space-y-2 p-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<Skeleton key={i} className="h-10 rounded-lg" />
							))}
						</div>
					</Card>
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
		<Card className="relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						"linear-gradient(oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			<CardContent className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
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
						<div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-6xl">
							🐺
						</div>
					)}
				</div>

				<div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="text-center sm:text-left">
						<h1 className="text-2xl font-bold text-foreground">{userName}</h1>
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
							<span className="text-sm text-muted-foreground">
								@{userName.toLowerCase().replace(/\s+/g, "")}
							</span>
						</div>
						{skinName && <p className="mt-1 text-xs text-primary/70">Equipped: {skinName}</p>}
					</div>

					<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
						<Badge className="font-mono font-bold">HI {highScore.toLocaleString()}</Badge>
						<Badge variant="purple" className="font-mono font-bold">
							{gamesPlayed} RUNS
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
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
		<Card>
			<CardHeader>
				<CardTitle>Performance Matrix</CardTitle>
			</CardHeader>
			<div className="grid grid-cols-2 gap-px bg-border/50 p-px">
				{tiles.map((tile) => (
					<div
						key={tile.label}
						className="rounded-xl border border-transparent bg-card p-4 transition-all hover:border-primary/30"
					>
						<p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
							{tile.label}
						</p>
						<p className={cn("font-mono text-2xl font-bold", tile.accent)}>{tile.value}</p>
					</div>
				))}
			</div>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Honor Badges                                                       */
/* ------------------------------------------------------------------ */

interface HonorBadge {
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
	badges: HonorBadge[];
	unlockedCount: number;
	totalCount: number;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Honor Badges</CardTitle>
				<span className="font-mono text-xs text-primary">
					{unlockedCount} / {totalCount}
				</span>
			</CardHeader>
			<CardContent>
				<TooltipProvider delayDuration={200}>
					<div className="flex flex-wrap gap-3">
						{badges.map((badge, i) => (
							<Tooltip key={i}>
								<TooltipTrigger asChild>
									<div
										tabIndex={0}
										className={cn(
											"flex size-12 items-center justify-center rounded-full border-2 transition-all cursor-default",
											badge.unlocked
												? "border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(15,172,237,0.2)]"
												: "border-border bg-muted/50 grayscale opacity-40",
										)}
									>
										<span className="text-2xl" role="img" aria-label={badge.name}>
											{badge.unlocked ? badge.icon : "🔒"}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-semibold">{badge.name}</p>
									<p className="text-muted-foreground">{badge.description}</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				</TooltipProvider>
			</CardContent>
		</Card>
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
	return <span className="font-mono text-xl font-bold text-muted-foreground">—</span>;
}

function RecentScorelines({ scores }: { scores: ScoreEntry[] }) {
	const top8 = scores.slice(0, 8);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Top Scores</CardTitle>
			</CardHeader>

			{top8.length === 0 ? (
				<CardContent className="py-8 text-center text-sm text-muted-foreground">
					No scores yet.
				</CardContent>
			) : (
				<ul className="divide-y divide-border/50">
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
								className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/30"
							>
								<TrendArrow trend={trend} />
								<div className="flex flex-1 flex-col gap-0.5">
									<span className="font-mono font-bold text-foreground">
										{entry.score.toLocaleString()}
									</span>
									<span className="text-xs text-muted-foreground">
										{fmtKm(entry.distance)} · {entry.difficulty} ·{" "}
										{new Date(entry.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
								{entry.obstaclesCleared > 0 && (
									<Badge variant="orange" className="font-mono">
										{entry.obstaclesCleared}
									</Badge>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Card>
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

	if (isPending) {
		return <PublicProfileSkeleton />;
	}

	if (error) {
		return (
			<main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="flex size-20 items-center justify-center rounded-full border-2 border-border bg-muted/50 text-4xl">
					🔍
				</div>
				<h1 className="text-xl font-bold text-foreground">User not found</h1>
				<p className="text-sm text-muted-foreground">
					This user does not exist or their profile is unavailable.
				</p>
			</main>
		);
	}

	if (profile.isPrivate) {
		return (
			<main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="flex size-20 items-center justify-center rounded-full border-2 border-border bg-muted/50 text-4xl">
					🔒
				</div>
				<h1 className="text-xl font-bold text-foreground">{profile.username}</h1>
				<p className="text-sm text-muted-foreground">This profile is private.</p>
			</main>
		);
	}

	const {
		username,
		userImage,
		level,
		totalXp,
		equippedSkin,
		stats,
		topScores,
		achievements,
		skinsUnlocked,
	} = profile;

	const levelInfo = getLevelFromXp(totalXp);
	const highScore = topScores.length > 0 ? (topScores[0]?.score ?? 0) : 0;

	const winRate =
		stats.racesPlayed > 0 ? `${((stats.racesWon / stats.racesPlayed) * 100).toFixed(0)}%` : "N/A";

	const performanceTiles: MetricTile[] = [
		{ label: "Total Distance", value: fmtKm(stats.totalDistance), accent: "text-primary" },
		{ label: "High Score", value: highScore.toLocaleString(), accent: "text-primary" },
		{ label: "Win Rate", value: winRate, accent: "text-emerald-400" },
		{
			label: "Obstacles",
			value: stats.obstaclesCleared.toLocaleString(),
			accent: "text-fang-orange",
		},
		{
			label: "Games Played",
			value: stats.gamesPlayed.toLocaleString(),
			accent: "text-fang-purple",
		},
		{ label: "Total Score", value: stats.totalScore.toLocaleString(), accent: "text-fang-gold" },
	];

	const unlockedBadges: HonorBadge[] = achievements
		.filter((a) => a.unlocked)
		.map((a) => ({
			icon: a.icon,
			name: a.name,
			description: a.description,
			unlocked: true,
		}));

	const lockedBadges: HonorBadge[] = achievements
		.filter((a) => !a.unlocked)
		.map((a) => ({
			icon: a.icon,
			name: a.name,
			description: a.description,
			unlocked: false,
		}));

	const BADGE_LIMIT = 12;
	const allBadges = [...unlockedBadges, ...lockedBadges].slice(0, BADGE_LIMIT);

	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				<ProfileHeader
					userName={username}
					userImage={userImage}
					skinSpriteKey={equippedSkin?.spriteKey ?? null}
					skinName={equippedSkin?.name ?? null}
					highScore={highScore}
					gamesPlayed={stats.gamesPlayed}
				/>

				{/* Level & XP Progress */}
				<Card>
					<CardContent className="p-5">
						<div className="mb-3 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 font-mono text-lg font-bold text-primary">
									{level}
								</span>
								<div>
									<p className="text-sm font-bold text-foreground">Level {level}</p>
									<p className="text-xs text-muted-foreground">
										{totalXp.toLocaleString()} XP total
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								{skinsUnlocked > 0 && (
									<Badge variant="gold" className="font-mono font-bold">
										{skinsUnlocked} SKINS
									</Badge>
								)}
								<p className="text-xs text-muted-foreground">
									{levelInfo.xpForCurrentLevel.toLocaleString()} /{" "}
									{levelInfo.xpForNextLevel.toLocaleString()} XP
								</p>
							</div>
						</div>
						<Progress value={Math.round(levelInfo.progress * 100)} />
					</CardContent>
				</Card>

				{/* Main two-column grid */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					<div className="space-y-6">
						<PerformanceMatrix tiles={performanceTiles} />
						<HonorBadges
							badges={allBadges}
							unlockedCount={unlockedBadges.length}
							totalCount={achievements.length}
						/>
					</div>

					<div className="lg:sticky lg:top-24 lg:self-start">
						<RecentScorelines scores={topScores} />
					</div>
				</div>
			</div>
		</main>
	);
}
