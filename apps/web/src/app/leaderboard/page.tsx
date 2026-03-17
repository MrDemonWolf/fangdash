"use client";

import type { DifficultyName } from "@fangdash/shared";
import { DIFFICULTY_LEVELS } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type Tab = "daily" | "weekly" | "all-time";

const TABS: { key: Tab; label: string }[] = [
	{ key: "daily", label: "Daily" },
	{ key: "weekly", label: "Weekly" },
	{ key: "all-time", label: "All Time" },
];

function RankBadge({ rank }: { rank: number }) {
	if (rank === 1) {
		return (
			<Badge variant="gold" className="size-8 justify-center rounded-full px-0 font-bold">
				{rank}
			</Badge>
		);
	}
	if (rank === 2) {
		return (
			<Badge variant="silver" className="size-8 justify-center rounded-full px-0 font-bold">
				{rank}
			</Badge>
		);
	}
	if (rank === 3) {
		return (
			<Badge variant="bronze" className="size-8 justify-center rounded-full px-0 font-bold">
				{rank}
			</Badge>
		);
	}
	return (
		<span className="inline-flex items-center justify-center size-8 text-muted-foreground font-medium text-sm">
			{rank}
		</span>
	);
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
	const level = DIFFICULTY_LEVELS.find((l) => l.name === difficulty);
	if (!level) return null;
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
			<span className="inline-block size-2 rounded-full" style={{ backgroundColor: level.color }} />
			<span className="hidden sm:inline">{level.label}</span>
		</span>
	);
}

function SkeletonRows() {
	return Array.from({ length: 5 }).map((_, i) => (
		<TableRow key={i}>
			<TableCell>
				<Skeleton className="size-8 rounded-full" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-4 w-24" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-4 w-16" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-4 w-16" />
			</TableCell>
			<TableCell className="hidden sm:table-cell">
				<Skeleton className="h-4 w-20" />
			</TableCell>
		</TableRow>
	));
}

function SkeletonCards() {
	return Array.from({ length: 5 }).map((_, i) => (
		<Card key={i} className="animate-pulse">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="size-8 rounded-full" />
					<Skeleton className="h-4 w-24" />
				</div>
				<div className="mt-3 flex gap-4">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
				</div>
			</CardContent>
		</Card>
	));
}

function formatDate(date: Date | string) {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatNumber(n: number) {
	return n.toLocaleString();
}

export default function LeaderboardPage() {
	const [activeTab, setActiveTab] = useState<Tab>("all-time");
	const [activeDifficulty, setActiveDifficulty] = useState<DifficultyName | "all">("all");
	const trpc = useTRPC();
	const { data: session } = useSession();

	const period = activeTab === "all-time" ? ("all" as const) : activeTab;

	const leaderboardQuery = useQuery(
		trpc.score.leaderboard.queryOptions({
			limit: 50,
			period,
			difficulty: activeDifficulty === "all" ? undefined : activeDifficulty,
		}),
	);

	const entries = leaderboardQuery.data ?? [];
	const currentUsername = session?.user?.name;

	useEffect(() => {
		if (leaderboardQuery.isError) {
			toast.error("Failed to load leaderboard.");
		}
	}, [leaderboardQuery.isError]);

	return (
		<main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-4xl">
				<h1 className="text-3xl font-bold text-foreground sm:text-4xl">Leaderboard</h1>
				<p className="mt-2 text-muted-foreground">Top runners in FangDash</p>

				{/* Period Tabs */}
				<div className="mt-6 flex gap-1 rounded-lg bg-muted p-1">
					{TABS.map((tab) => (
						<button
							type="button"
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							aria-pressed={activeTab === tab.key}
							className={cn(
								"flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
								activeTab === tab.key
									? "bg-secondary text-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Difficulty Filter */}
				<div className="mt-3 flex gap-1 rounded-lg bg-muted p-1">
					<button
						type="button"
						onClick={() => setActiveDifficulty("all")}
						aria-pressed={activeDifficulty === "all"}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
							activeDifficulty === "all"
								? "bg-secondary text-foreground"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
						)}
					>
						All
					</button>
					{DIFFICULTY_LEVELS.map((level) => (
						<button
							type="button"
							key={level.name}
							onClick={() => setActiveDifficulty(level.name)}
							aria-pressed={activeDifficulty === level.name}
							className={cn(
								"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
								activeDifficulty === level.name
									? "bg-muted-foreground/10 text-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
							)}
						>
							<span
								className="inline-block size-2 rounded-full"
								style={{ backgroundColor: level.color }}
							/>
							<span className="hidden sm:inline">{level.label}</span>
						</button>
					))}
				</div>

				{/* Desktop Table */}
				<div className="mt-6 hidden sm:block">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-16">Rank</TableHead>
								<TableHead>Username</TableHead>
								<TableHead>Score</TableHead>
								<TableHead>Distance</TableHead>
								{activeDifficulty === "all" && <TableHead>Difficulty</TableHead>}
								<TableHead>Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{leaderboardQuery.isLoading && <SkeletonRows />}
							{!leaderboardQuery.isLoading && entries.length === 0 && (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={activeDifficulty === "all" ? 6 : 5}
										className="py-12 text-center text-muted-foreground"
									>
										No scores yet. Be the first to play!
									</TableCell>
								</TableRow>
							)}
							{entries.map((entry) => {
								const isCurrentUser = currentUsername != null && entry.username === currentUsername;
								return (
									<TableRow
										key={entry.scoreId}
										className={cn(isCurrentUser && "bg-primary/10 border-primary/20")}
									>
										<TableCell>
											<RankBadge rank={entry.rank} />
										</TableCell>
										<TableCell className="font-medium text-foreground">
											<span className="inline-flex items-center gap-2">
												{"profilePublic" in entry &&
												entry.profilePublic === 1 &&
												"userId" in entry ? (
													<Link
														href={`/profile/${entry.userId}`}
														className="hover:text-primary transition-colors hover:underline"
													>
														{entry.username}
													</Link>
												) : (
													entry.username
												)}
												{"level" in entry && <Badge variant="level">Lv.{entry.level}</Badge>}
												{isCurrentUser && <span className="text-xs text-primary">(you)</span>}
											</span>
										</TableCell>
										<TableCell className="text-foreground tabular-nums">
											{formatNumber(entry.score)}
										</TableCell>
										<TableCell className="text-secondary-foreground tabular-nums">
											{formatNumber(Math.round(entry.distance))}m
										</TableCell>
										{activeDifficulty === "all" && (
											<TableCell>
												<DifficultyBadge difficulty={entry.difficulty} />
											</TableCell>
										)}
										<TableCell className="text-muted-foreground">
											{formatDate(entry.createdAt)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>

				{/* Mobile Card Layout */}
				<div className="mt-6 flex flex-col gap-3 sm:hidden">
					{leaderboardQuery.isLoading && <SkeletonCards />}
					{!leaderboardQuery.isLoading && entries.length === 0 && (
						<Card>
							<CardContent className="px-4 py-12 text-center text-muted-foreground">
								No scores yet. Be the first to play!
							</CardContent>
						</Card>
					)}
					{entries.map((entry) => {
						const isCurrentUser = currentUsername != null && entry.username === currentUsername;
						return (
							<Card
								key={entry.scoreId}
								className={cn(
									"transition-colors",
									isCurrentUser && "border-primary/20 bg-primary/5",
								)}
							>
								<CardContent className="p-4">
									<div className="flex items-center gap-3">
										<RankBadge rank={entry.rank} />
										<span className="inline-flex items-center gap-2 font-medium text-foreground">
											{"profilePublic" in entry &&
											entry.profilePublic === 1 &&
											"userId" in entry ? (
												<Link
													href={`/profile/${entry.userId}`}
													className="hover:text-primary transition-colors hover:underline"
												>
													{entry.username}
												</Link>
											) : (
												entry.username
											)}
											{"level" in entry && <Badge variant="level">Lv.{entry.level}</Badge>}
											{isCurrentUser && <span className="text-xs text-primary">(you)</span>}
										</span>
										{activeDifficulty === "all" && (
											<DifficultyBadge difficulty={entry.difficulty} />
										)}
									</div>
									<div className="mt-3 flex items-center gap-4 text-sm">
										<div>
											<span className="text-muted-foreground">Score </span>
											<span className="text-foreground tabular-nums font-medium">
												{formatNumber(entry.score)}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Distance </span>
											<span className="text-secondary-foreground tabular-nums">
												{formatNumber(Math.round(entry.distance))}m
											</span>
										</div>
									</div>
									<div className="mt-1 text-xs text-muted-foreground/60">
										{formatDate(entry.createdAt)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</main>
	);
}
