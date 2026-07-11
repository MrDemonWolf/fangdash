"use client";

import { ACHIEVEMENTS, getLevelFromXp, getSkinById } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type HonorBadge, HonorBadges } from "@/components/profile/HonorBadges.tsx";
import {
	buildPerformanceTiles,
	PerformanceMatrix,
} from "@/components/profile/PerformanceMatrix.tsx";
import { ProfileHeader } from "@/components/profile/ProfileHeader.tsx";
import { type ScoreEntry, RecentScorelines } from "@/components/profile/RecentScorelines.tsx";
import { useSession } from "@/lib/auth-client.ts";
import { formatWinRate } from "@/lib/format.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProfileSkeleton } from "./_skeleton.tsx";

export default function ProfilePage() {
	const router = useRouter();
	const { data: session, isPending: sessionLoading } = useSession();
	const trpc = useTRPC();

	const isSignedIn = !!session?.user;
	const [copied, setCopied] = useState(false);

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

	const performanceTiles = buildPerformanceTiles({
		totalDistance,
		highScore,
		winRate: formatWinRate(raceStats?.racesPlayed ?? 0, raceStats?.racesWon ?? 0),
		obstacles: totalObstacles,
		gamesPlayed,
		totalScore,
	});

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
						<RecentScorelines
							scores={recentScores}
							title="Recent Scorelines"
							emptyText="No scores yet. Play a game!"
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
