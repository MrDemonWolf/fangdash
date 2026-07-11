"use client";

import { getLevelFromXp } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { type HonorBadge, HonorBadges } from "@/components/profile/HonorBadges.tsx";
import {
	buildPerformanceTiles,
	PerformanceMatrix,
} from "@/components/profile/PerformanceMatrix.tsx";
import { ProfileHeader } from "@/components/profile/ProfileHeader.tsx";
import { RecentScorelines } from "@/components/profile/RecentScorelines.tsx";
import { formatWinRate } from "@/lib/format.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

	const performanceTiles = buildPerformanceTiles({
		totalDistance: stats.totalDistance,
		highScore,
		winRate: formatWinRate(stats.racesPlayed, stats.racesWon),
		obstacles: stats.obstaclesCleared,
		gamesPlayed: stats.gamesPlayed,
		totalScore: stats.totalScore,
	});

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
						<RecentScorelines scores={topScores} title="Top Scores" />
					</div>
				</div>
			</div>
		</main>
	);
}
