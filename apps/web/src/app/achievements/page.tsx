"use client";

import type { AchievementCategory, AchievementCondition } from "@fangdash/shared";
import { getSkinById } from "@fangdash/shared";
import { Check } from "lucide-react";
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
}: AchievementCardProps) {
	const skin = rewardSkinId ? getSkinById(rewardSkinId) : null;

	return (
		<Card
			className={cn(
				"relative transition-all border",
				unlocked
					? "border-primary/40 shadow-[0_0_20px_rgba(15,172,237,0.15)]"
					: "border-border opacity-60 grayscale",
			)}
		>
			<CardContent className="p-5">
				<div className="flex items-start gap-4">
					<span className="text-3xl" role="img" aria-label={name}>
						{icon}
					</span>
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
							<p className="mt-2 text-xs text-primary">Unlocked {formatDate(unlockedAt)}</p>
						) : condition ? (
							<p className="mt-2 text-xs text-muted-foreground italic">
								{formatCondition(condition)}
							</p>
						) : null}

						{skin && <p className="mt-1 text-xs text-primary/70">Rewards: {skin.name}</p>}
					</div>
				</div>

				{unlocked && (
					<div className="absolute top-3 right-3 text-primary">
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
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground sm:text-4xl">Achievements</h1>
					{isSignedIn ? (
						<p className="mt-2 text-lg text-primary">
							{unlockedCount} of {totalCount} achievements unlocked
						</p>
					) : (
						<p className="mt-2 text-lg text-muted-foreground">Sign in to track progress</p>
					)}
				</div>

				{/* Category filter tabs */}
				<div className="mb-8 flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<button
							type="button"
							key={cat.value}
							onClick={() => setActiveCategory(cat.value)}
							className={cn(
								"rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
								activeCategory === cat.value
									? "bg-secondary text-foreground"
									: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
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
