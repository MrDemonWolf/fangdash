"use client";

import { ACHIEVEMENTS, getLevelFromXp, getSkinById } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProfileSkeleton } from "./_skeleton.tsx";

/* ------------------------------------------------------------------ */
/*  Helper: format distance as km                                      */
/* ------------------------------------------------------------------ */

function fmtKm(meters: number): string {
	return `${(meters / 1000).toFixed(1)} km`;
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
			{/* Subtle grid overlay */}
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						"linear-gradient(oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			<CardContent className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
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
						<div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-6xl">
							🐺
						</div>
					)}
				</div>

				{/* Info */}
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

					{/* Right-side badges */}
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
										className={cn(
											"flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all cursor-default",
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
				<CardTitle>Recent Scorelines</CardTitle>
			</CardHeader>

			{top8.length === 0 ? (
				<CardContent className="py-8 text-center text-sm text-muted-foreground">
					No scores yet. Play a game!
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
										{fmtKm(entry.distance)} ·{" "}
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

export default function ProfilePage() {
	const router = useRouter();
	const { data: session, isPending: sessionLoading } = useSession();
	const trpc = useTRPC();

	const isSignedIn = !!session?.user;

	const { data: scores, isPending: scoresLoading } = useQuery(
		trpc.score.myScores.queryOptions(undefined, { enabled: isSignedIn }),
	);

	const { data: equippedSkin, isPending: skinLoading } = useQuery(
		trpc.skin.getEquippedSkin.queryOptions(undefined, { enabled: isSignedIn }),
	);

	const { data: achievements, isPending: achievementsLoading } = useQuery(
		trpc.achievement.getMine.queryOptions(undefined, { enabled: isSignedIn }),
	);

	const { data: playerStats, isPending: playerStatsLoading } = useQuery(
		trpc.score.getPlayerStats.queryOptions(undefined, { enabled: isSignedIn }),
	);

	const { data: raceStats, isPending: raceStatsLoading } = useQuery(
		trpc.race.getStats.queryOptions(undefined, { enabled: isSignedIn }),
	);

	const isDataLoading =
		scoresLoading || skinLoading || achievementsLoading || raceStatsLoading || playerStatsLoading;

	useEffect(() => {
		if (!(sessionLoading || session?.user)) {
			router.replace("/");
		}
	}, [sessionLoading, session, router]);

	if (sessionLoading || (isSignedIn && isDataLoading)) {
		return <ProfileSkeleton />;
	}

	if (!session?.user) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center">
				<p className="text-lg text-muted-foreground">Sign in to view your profile.</p>
			</main>
		);
	}

	const user = session.user;

	const skinDef = equippedSkin ? getSkinById(equippedSkin.skinId) : null;

	const highScore = scores && scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

	const gamesPlayed = playerStats?.gamesPlayed ?? 0;
	const totalDistance = playerStats?.totalDistance ?? 0;
	const totalObstacles = playerStats?.totalObstaclesCleared ?? 0;
	const totalScore = playerStats?.totalScore ?? 0;
	const totalXp = Number(playerStats?.totalXp) || 0;
	const levelInfo = getLevelFromXp(totalXp);
	const playerLevel = levelInfo.level;

	const racesPlayed = raceStats?.racesPlayed ?? 0;
	const racesWon = raceStats?.racesWon ?? 0;
	const winRate = racesPlayed > 0 ? `${((racesWon / racesPlayed) * 100).toFixed(0)}%` : "N/A";

	const performanceTiles: MetricTile[] = [
		{ label: "Total Distance", value: fmtKm(totalDistance), accent: "text-primary" },
		{ label: "High Score", value: highScore.toLocaleString(), accent: "text-primary" },
		{ label: "Win Rate", value: winRate, accent: "text-emerald-400" },
		{ label: "Obstacles", value: totalObstacles.toLocaleString(), accent: "text-fang-orange" },
		{ label: "Games Played", value: gamesPlayed.toLocaleString(), accent: "text-fang-purple" },
		{ label: "Total Score", value: totalScore.toLocaleString(), accent: "text-fang-gold" },
	];

	const unlockedIds = new Set((achievements ?? []).map((a) => a?.id));
	const sortedUnlocked = [...(achievements ?? [])]
		.filter((a): a is NonNullable<typeof a> => a != null)
		.sort((a, b) => {
			const aT = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
			const bT = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
			return bT - aT;
		});

	const BADGE_LIMIT = 12;
	const unlockedBadges: HonorBadge[] = sortedUnlocked
		.slice(0, BADGE_LIMIT)
		.filter((a): a is NonNullable<typeof a> => a != null)
		.map((a) => ({
			icon: a.icon ?? "default",
			name: a.name ?? "Unnamed Badge",
			description: a.description ?? "",
			unlocked: true,
		}));

	const lockedDefs = ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));
	const lockedBadges: HonorBadge[] = lockedDefs
		.slice(0, Math.max(0, BADGE_LIMIT - unlockedBadges.length))
		.map((a) => ({
			icon: a.icon,
			name: a.name,
			description: a.description,
			unlocked: false,
		}));

	const allBadges = [...unlockedBadges, ...lockedBadges];

	const recentScores = (scores ?? []) as ScoreEntry[];

	const [copied, setCopied] = useState(false);
	const shareUrl =
		typeof window !== "undefined" ? `${window.location.origin}/profile/${user.id}` : "";
	const handleShareProfile = () => {
		navigator.clipboard.writeText(shareUrl).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				<ProfileHeader
					userName={user.name ?? "Unknown"}
					userImage={user.image}
					skinSpriteKey={skinDef?.spriteKey ?? null}
					skinName={skinDef?.name ?? null}
					highScore={highScore}
					gamesPlayed={gamesPlayed}
				/>

				{/* Quick actions */}
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" onClick={handleShareProfile}>
						{copied ? "Link copied!" : "Share profile"}
					</Button>
					<Button variant="secondary" size="sm" asChild>
						<Link href="/settings">Settings</Link>
					</Button>
				</div>

				{/* Level & XP Progress */}
				<Card>
					<CardContent className="p-5">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-3">
								<span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 font-mono text-lg font-bold text-primary">
									{playerLevel}
								</span>
								<div>
									<p className="text-sm font-bold text-foreground">Level {playerLevel}</p>
									<p className="text-xs text-muted-foreground">
										{totalXp.toLocaleString()} XP total
									</p>
								</div>
							</div>
							<p className="text-xs text-muted-foreground">
								{levelInfo.xpForCurrentLevel.toLocaleString()} /{" "}
								{levelInfo.xpForNextLevel.toLocaleString()} XP
							</p>
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
							unlockedCount={sortedUnlocked.length}
							totalCount={ACHIEVEMENTS.length}
						/>
					</div>

					<div className="lg:sticky lg:top-24 lg:self-start">
						<RecentScorelines scores={recentScores} />
					</div>
				</div>
			</div>
		</main>
	);
}
