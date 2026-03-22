"use client";

import type { AchievementCategory, AchievementCondition } from "@fangdash/shared";
import { getSkinById } from "@fangdash/shared";
import { Check, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES: Array<{ label: string; value: AchievementCategory | "all" }> = [
	{ label: "All", value: "all" },
	{ label: "Score", value: "score" },
	{ label: "Distance", value: "distance" },
	{ label: "Games", value: "games" },
	{ label: "Skill", value: "skill" },
	{ label: "Social", value: "social" },
];

function formatCondition(condition: AchievementCondition): string {
	switch (condition.type) {
		case "score_single":
			return `Score ${condition.threshold.toLocaleString()} in a single run`;
		case "score_total":
			return `Score ${condition.threshold.toLocaleString()} total points`;
		case "distance_single":
			return `Run ${condition.threshold.toLocaleString()}m in a single run`;
		case "distance_total":
			return `Run ${condition.threshold.toLocaleString()}m total`;
		case "games_played":
			return `Play ${condition.count.toLocaleString()} games`;
		case "obstacles_cleared":
			return `Clear ${condition.count.toLocaleString()} obstacles`;
		case "races_won":
			return `Win ${condition.count.toLocaleString()} races`;
		case "races_played":
			return `Play ${condition.count.toLocaleString()} races`;
		case "perfect_run":
			return `Run ${condition.distance.toLocaleString()}m without hitting obstacles`;
		case "time_survived":
			return `Survive ${Math.round(condition.threshold / 1000)}s in a single run`;
		case "score_with_mods":
			return `Score ${condition.threshold.toLocaleString()} with required mods active`;
		case "distance_with_mods":
			return `Run ${condition.threshold.toLocaleString()}m with required mods active`;
		case "combo":
			return condition.conditions.map(formatCondition).join(" and ");
	}
}

function formatDate(date: Date | string | null): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

interface AchievementCardProps {
	icon: string;
	name: string;
	description: string;
	category: AchievementCategory;
	unlocked: boolean;
	unlockedAt?: Date | string | null;
	condition?: AchievementCondition | undefined;
	rewardSkinId?: string | null | undefined;
	unlockPercent?: number | null;
}

function AchievementCard({
	icon,
	name,
	description,
	category,
	unlocked,
	unlockedAt,
	condition,
	rewardSkinId,
	unlockPercent,
}: AchievementCardProps) {
	const skin = rewardSkinId ? getSkinById(rewardSkinId) : null;

	return (
		<Card
			className={cn(
				"fang-accent relative transition-all border",
				unlocked
					? "border-primary/40 shadow-[var(--glow-cyan)]"
					: "border-border opacity-60 grayscale",
			)}
		>
			<CardContent className="p-5">
				<div className="flex items-start gap-4">
					<div className="relative flex-shrink-0">
						<span className="text-4xl" role="img" aria-label={name}>
							{icon}
						</span>
						{!unlocked && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Lock className="size-5 text-muted-foreground drop-shadow-lg" />
							</div>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3
								className={cn(
									"font-semibold",
									unlocked ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{name}
							</h3>
							<Badge variant={unlocked ? "default" : "secondary"} className="capitalize">
								{category}
							</Badge>
						</div>
						<p className="mt-1 text-sm text-muted-foreground">{description}</p>

						{unlocked && unlockedAt ? (
							<p className="mt-2 font-mono text-xs text-fang-cyan">
								Unlocked {formatDate(unlockedAt)}
							</p>
						) : condition ? (
							<p className="mt-2 text-xs text-muted-foreground italic">
								{formatCondition(condition)}
							</p>
						) : null}

						{skin && (
							<p className="mt-1 text-xs font-semibold text-fang-gold drop-shadow-[var(--glow-gold)]">
								Rewards: {skin.name}
							</p>
						)}

						{unlockPercent != null && (
							<p className="mt-1 text-xs text-muted-foreground">
								{unlockPercent.toFixed(1)}% of players
							</p>
						)}
					</div>
				</div>

				{unlocked && (
					<div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 p-1 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
						<Check className="size-5" />
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default function AchievementsPage() {
	const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

	const { data: session } = useSession();
	const isSignedIn = !!session?.user;

	const trpc = useTRPC();

	const getAllOptions = trpc.achievement.getAll.queryOptions();
	const listOptions = trpc.achievement.list.queryOptions();
	const statsOptions = trpc.achievement.getStats.queryOptions();

	const {
		data: authenticatedAchievements,
		isLoading: isLoadingAuth,
		isError: isErrorAuth,
	} = useQuery({
		...getAllOptions,
		enabled: isSignedIn,
	});

	const {
		data: publicAchievements,
		isLoading: isLoadingPublic,
		isError: isErrorPublic,
	} = useQuery({
		...listOptions,
		enabled: !isSignedIn,
	});

	const { data: statsData } = useQuery(statsOptions);

	const isLoading = isSignedIn ? isLoadingAuth : isLoadingPublic;
	const isError = isSignedIn ? isErrorAuth : isErrorPublic;

	useEffect(() => {
		if (isError) {
			toast.error("Failed to load achievements.");
		}
	}, [isError]);

	const achievements = isSignedIn
		? (authenticatedAchievements ?? [])
		: (publicAchievements ?? []).map((a) => ({
				...a,
				unlocked: false,
				unlockedAt: null,
				condition: undefined,
			}));

	const filtered =
		activeCategory === "all"
			? achievements
			: achievements.filter((a) => a.category === activeCategory);

	const totalCount = achievements.length;
	const unlockedCount = achievements.filter((a) => a.unlocked).length;

	return (
		<main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-5xl">
				{/* ── Page title with fang decorative lines ── */}
				<div className="mb-8">
					<div className="flex items-center gap-4">
						<span className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-fang-cyan/60" />
						<h1 className="text-3xl font-bold text-glow-cyan text-fang-cyan sm:text-4xl">
							Achievements
						</h1>
						<span className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-fang-cyan/60" />
					</div>
					{isSignedIn ? (
						<p className="mt-2 text-center text-lg">
							<span className="font-mono font-bold text-fang-cyan">{unlockedCount}</span>
							<span className="text-muted-foreground"> of </span>
							<span className="font-mono font-bold text-fang-cyan">{totalCount}</span>
							<span className="text-muted-foreground"> achievements unlocked</span>
						</p>
					) : (
						<p className="mt-2 text-center text-lg text-muted-foreground">
							Sign in to track progress
						</p>
					)}
				</div>

				{/* Category filter pills */}
				<div className="mb-8 flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<button
							type="button"
							key={cat.value}
							onClick={() => setActiveCategory(cat.value)}
							className={cn(
								"rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer",
								activeCategory === cat.value
									? "border-primary/60 bg-primary/10 text-fang-cyan shadow-[var(--glow-cyan)]"
									: "border-border/40 bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
							)}
						>
							{cat.label}
						</button>
					))}
				</div>

				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-40 rounded-2xl" />
						))}
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filtered.map((achievement) => (
							<AchievementCard
								key={achievement.id}
								icon={achievement.icon}
								name={achievement.name}
								description={achievement.description}
								category={achievement.category}
								unlocked={achievement.unlocked}
								unlockedAt={"unlockedAt" in achievement ? achievement.unlockedAt : null}
								condition={"condition" in achievement ? achievement.condition : undefined}
								rewardSkinId={achievement.rewardSkinId}
								unlockPercent={(() => {
									const stat = statsData?.[achievement.id];
									if (!stat || stat.totalPlayers === 0) return null;
									return (stat.unlockCount / stat.totalPlayers) * 100;
								})()}
							/>
						))}
					</div>
				)}

				{!isLoading && filtered.length === 0 && (
					<div className="py-20 text-center text-muted-foreground">
						No achievements found in this category.
					</div>
				)}
			</div>
		</main>
	);
}
