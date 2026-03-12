"use client";

import type {
	AchievementCategory,
	AchievementCondition,
} from "@fangdash/shared";
import { getSkinById } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";

const CATEGORIES: Array<{ label: string; value: AchievementCategory | "all" }> =
	[
		{ label: "All", value: "all" },
		{ label: "Score", value: "score" },
		{ label: "Distance", value: "distance" },
		{ label: "Games", value: "games" },
		{ label: "Skill", value: "skill" },
		{ label: "Social", value: "social" },
	];

function formatCondition(condition: AchievementCondition): string {
	// biome-ignore lint/style/useDefaultSwitchClause: exhaustive cases
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
	if (!date) {
		return "";
	}
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
	condition?: AchievementCondition;
	rewardSkinId?: string | null;
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
		<div
			className={`relative rounded-xl border p-5 transition-all ${
				unlocked
					? "border-[#0FACED]/40 bg-[#091533]/80 shadow-[0_0_20px_rgba(15,172,237,0.15)]"
					: "border-white/10 bg-[#091533]/40 opacity-60 grayscale"
			}`}
		>
			<div className="flex items-start gap-4">
				<span className="text-3xl" role="img" aria-label={name}>
					{icon}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3
							className={`font-semibold ${
								unlocked ? "text-white" : "text-gray-400"
							}`}
						>
							{name}
						</h3>
						<span
							className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
								unlocked
									? "bg-[#0FACED]/20 text-[#0FACED]"
									: "bg-white/5 text-gray-500"
							}`}
						>
							{category}
						</span>
					</div>
					<p className="mt-1 text-sm text-gray-400">{description}</p>

					{unlocked && unlockedAt ? (
						<p className="mt-2 text-xs text-[#0FACED]">
							Unlocked {formatDate(unlockedAt)}
						</p>
					) : condition ? (
						<p className="mt-2 text-xs text-gray-500 italic">
							{formatCondition(condition)}
						</p>
					) : null}

					{skin && (
						<p className="mt-1 text-xs text-[#0FACED]/70">
							Rewards: {skin.name}
						</p>
					)}
				</div>
			</div>

			{unlocked && (
				<div className="absolute top-3 right-3 text-[#0FACED]">
					<svg
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
			)}
		</div>
	);
}

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function AchievementsPage() {
	const [activeCategory, setActiveCategory] = useState<
		AchievementCategory | "all"
	>("all");

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
		<main className="min-h-screen bg-[#091533] px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-5xl">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white sm:text-4xl">
						Achievements
					</h1>
					{isSignedIn ? (
						<p className="mt-2 text-lg text-[#0FACED]">
							{unlockedCount} of {totalCount} achievements unlocked
						</p>
					) : (
						<p className="mt-2 text-lg text-gray-400">
							Sign in to track progress
						</p>
					)}
				</div>

				{/* Category filter tabs */}
				<div className="mb-8 flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<button
							type="button"
							key={cat.value}
							onClick={() => setActiveCategory(cat.value)}
							className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								activeCategory === cat.value
									? "bg-[#0FACED] text-[#091533]"
									: "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
							}`}
						>
							{cat.label}
						</button>
					))}
				</div>

				{/* Loading state */}
				{isLoading ? (
					<div className="py-20 text-center text-gray-400">
						Loading achievements...
					</div>
				) : (
					/* Achievement grid */
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filtered.map((achievement) => (
							<AchievementCard
								key={achievement.id}
								icon={achievement.icon}
								name={achievement.name}
								description={achievement.description}
								category={achievement.category}
								unlocked={achievement.unlocked}
								unlockedAt={
									"unlockedAt" in achievement ? achievement.unlockedAt : null
								}
								condition={
									"condition" in achievement ? achievement.condition : undefined
								}
								rewardSkinId={achievement.rewardSkinId}
							/>
						))}
					</div>
				)}

				{!isLoading && filtered.length === 0 && (
					<div className="py-20 text-center text-gray-500">
						No achievements found in this category.
					</div>
				)}
			</div>
		</main>
	);
}
