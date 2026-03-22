"use client";

import type { DifficultyName } from "@fangdash/shared";
import {
	areModsCompatible,
	DIFFICULTY_LEVELS,
	MOD_DEFINITIONS,
	decodeMods,
} from "@fangdash/shared";
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
			<Badge
				variant="gold"
				className="size-8 justify-center rounded-full px-0 font-bold shadow-[var(--glow-gold)]"
			>
				{rank}
			</Badge>
		);
	}
	if (rank === 2) {
		return (
			<Badge
				variant="silver"
				className="size-8 justify-center rounded-full px-0 font-bold shadow-[0_0_16px_oklch(0.7_0.01_260/0.4)]"
			>
				{rank}
			</Badge>
		);
	}
	if (rank === 3) {
		return (
			<Badge
				variant="bronze"
				className="size-8 justify-center rounded-full px-0 font-bold shadow-[0_0_16px_oklch(0.65_0.12_55/0.4)]"
			>
				{rank}
			</Badge>
		);
	}
	return (
		<span className="inline-flex items-center justify-center size-8 font-mono text-muted-foreground font-medium text-sm">
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

function ModIcons({ mods }: { mods: number }) {
	if (!mods) return null;
	const activeMods = decodeMods(mods);
	return (
		<span className="inline-flex items-center gap-0.5 ml-1">
			{activeMods.map((mod) => (
				<span key={mod.id} className="text-xs" title={mod.name}>
					{mod.icon}
				</span>
			))}
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

function buildModsMask(selectedFlags: Set<number>): number {
	let mask = 0;
	for (const flag of selectedFlags) {
		mask |= flag;
	}
	return mask;
}

export default function LeaderboardPage() {
	const [activeTab, setActiveTab] = useState<Tab>("all-time");
	const [activeDifficulty, setActiveDifficulty] = useState<DifficultyName | "all">("all");
	const [selectedModFlags, setSelectedModFlags] = useState<Set<number>>(new Set());
	const [modsMode, setModsMode] = useState<"all" | "none" | "selected">("all");
	const trpc = useTRPC();
	const { data: session } = useSession();

	const period = activeTab === "all-time" ? ("all" as const) : activeTab;

	const activeMods: number | undefined =
		modsMode === "all" ? undefined : modsMode === "none" ? 0 : buildModsMask(selectedModFlags);

	const leaderboardQuery = useQuery(
		trpc.score.leaderboard.queryOptions({
			limit: 50,
			period,
			difficulty: activeDifficulty === "all" ? undefined : activeDifficulty,
			mods: activeMods,
		}),
	);

	const entries = leaderboardQuery.data ?? [];
	const currentUsername = session?.user?.name;

	useEffect(() => {
		if (leaderboardQuery.isError) {
			toast.error("Failed to load leaderboard.");
		}
	}, [leaderboardQuery.isError]);

	function toggleModFlag(flag: number) {
		const next = new Set(selectedModFlags);
		if (next.has(flag)) {
			next.delete(flag);
		} else {
			// Check compatibility before adding
			const combined = buildModsMask(next) | flag;
			if (!areModsCompatible(combined)) return;
			next.add(flag);
		}
		if (next.size === 0) {
			setModsMode("all");
		} else {
			setModsMode("selected");
		}
		setSelectedModFlags(next);
	}

	const readyMods = MOD_DEFINITIONS.filter((m) => m.ready);

	return (
		<main className="min-h-screen bg-[var(--color-surface-void)] px-4 py-10 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-4xl">
				{/* Title with decorative fang lines */}
				<div className="flex flex-col items-center text-center">
					<span className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground">
						{"—⟨ "}Leaderboard{" ⟩—"}
					</span>
					<h1 className="mt-2 text-3xl font-bold text-glow-cyan text-fang-cyan sm:text-4xl">
						Leaderboard
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">Top runners in FangDash</p>
				</div>

				{/* Filters */}
				<Card className="fang-accent mt-8 border-border/40 bg-[var(--color-surface-elevated)]">
					<CardContent className="flex flex-col gap-3 p-3">
						{/* Period */}
						<div>
							<span className="mb-1 block text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
								Period
							</span>
							<div className="flex flex-wrap gap-1 rounded-lg bg-[var(--color-surface-base)] p-1">
								{TABS.map((tab) => (
									<button
										type="button"
										key={tab.key}
										onClick={() => setActiveTab(tab.key)}
										aria-pressed={activeTab === tab.key}
										className={cn(
											"flex-1 rounded-md px-4 py-2 text-sm font-medium font-mono transition-all cursor-pointer",
											activeTab === tab.key
												? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
												: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
										)}
									>
										{tab.label}
									</button>
								))}
							</div>
						</div>

						{/* Difficulty */}
						<div>
							<span className="mb-1 block text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
								Difficulty
							</span>
							<div className="flex flex-wrap gap-1 rounded-lg bg-[var(--color-surface-base)] p-1">
								<button
									type="button"
									onClick={() => setActiveDifficulty("all")}
									aria-pressed={activeDifficulty === "all"}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm font-medium font-mono transition-all cursor-pointer",
										activeDifficulty === "all"
											? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
											: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
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
											"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium font-mono transition-all cursor-pointer",
											activeDifficulty === level.name
												? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
												: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
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
						</div>

						{/* Mods — multi-toggle */}
						<div>
							<span className="mb-1 block text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
								Mods
							</span>
							<div className="flex flex-wrap gap-1 rounded-lg bg-[var(--color-surface-base)] p-1">
								<button
									type="button"
									onClick={() => {
										setModsMode("all");
										setSelectedModFlags(new Set());
									}}
									aria-pressed={modsMode === "all"}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm font-medium font-mono transition-all cursor-pointer",
										modsMode === "all"
											? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
											: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
									)}
								>
									All
								</button>
								<button
									type="button"
									onClick={() => {
										setModsMode("none");
										setSelectedModFlags(new Set());
									}}
									aria-pressed={modsMode === "none"}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm font-medium font-mono transition-all cursor-pointer",
										modsMode === "none"
											? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
											: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
									)}
								>
									No Mods
								</button>
								{readyMods.map((mod) => {
									const isActive = modsMode === "selected" && selectedModFlags.has(mod.flag);
									const combinedIfAdded = buildModsMask(selectedModFlags) | mod.flag;
									const isDisabled =
										!isActive && modsMode === "selected" && !areModsCompatible(combinedIfAdded);
									return (
										<button
											type="button"
											key={mod.id}
											disabled={isDisabled}
											onClick={() => {
												setModsMode("selected");
												toggleModFlag(mod.flag);
											}}
											aria-pressed={isActive}
											className={cn(
												"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium font-mono transition-all cursor-pointer",
												isActive
													? "bg-fang-cyan/15 text-fang-cyan shadow-[var(--glow-cyan)] border border-fang-cyan/30"
													: "text-muted-foreground hover:text-foreground hover:bg-surface-bright/50",
												isDisabled && "opacity-40 cursor-not-allowed",
											)}
										>
											<span>{mod.icon}</span>
											<span className="hidden sm:inline">{mod.name}</span>
										</button>
									);
								})}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Desktop Table */}
				<div className="mt-8 hidden sm:block overflow-hidden rounded-xl border border-border/40 bg-[var(--color-surface-base)]">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-border/40">
								<TableHead className="w-16 uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
									Rank
								</TableHead>
								<TableHead className="uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
									Username
								</TableHead>
								<TableHead className="uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
									Score
								</TableHead>
								<TableHead className="uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
									Distance
								</TableHead>
								{activeDifficulty === "all" && (
									<TableHead className="uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
										Difficulty
									</TableHead>
								)}
								<TableHead className="uppercase tracking-[0.15em] text-muted-foreground font-mono text-xs">
									Date
								</TableHead>
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
										className={cn(
											"transition-colors hover:bg-secondary/50",
											isCurrentUser && "border-l-2 border-l-fang-cyan bg-fang-cyan/5",
										)}
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
														className="hover:text-fang-cyan transition-colors hover:underline"
													>
														{entry.username}
													</Link>
												) : (
													entry.username
												)}
												{"level" in entry && <Badge variant="level">Lv.{entry.level}</Badge>}
												{isCurrentUser && <span className="text-xs text-fang-cyan">(you)</span>}
											</span>
										</TableCell>
										<TableCell className="font-mono text-glow-cyan tabular-nums">
											{formatNumber(entry.score)}
											{"mods" in entry && typeof entry.mods === "number" && entry.mods > 0 && (
												<ModIcons mods={entry.mods} />
											)}
										</TableCell>
										<TableCell className="font-mono text-foreground/80 tabular-nums">
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
				<div className="mt-8 flex flex-col gap-3 sm:hidden">
					{leaderboardQuery.isLoading && <SkeletonCards />}
					{!leaderboardQuery.isLoading && entries.length === 0 && (
						<Card className="border-border/40 bg-[var(--color-surface-base)]">
							<CardContent className="px-4 py-12 text-center font-mono text-muted-foreground">
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
									"fang-accent transition-colors border-border/40 bg-[var(--color-surface-base)]",
									isCurrentUser && "border-l-2 border-l-fang-cyan bg-fang-cyan/5",
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
													className="hover:text-fang-cyan transition-colors hover:underline"
												>
													{entry.username}
												</Link>
											) : (
												entry.username
											)}
											{"level" in entry && <Badge variant="level">Lv.{entry.level}</Badge>}
											{isCurrentUser && <span className="text-xs text-fang-cyan">(you)</span>}
										</span>
										{activeDifficulty === "all" && (
											<DifficultyBadge difficulty={entry.difficulty} />
										)}
									</div>
									<div className="mt-3 flex items-center gap-4 text-sm">
										<div>
											<span className="font-mono uppercase tracking-[0.1em] text-xs text-muted-foreground">
												Score{" "}
											</span>
											<span className="font-mono text-glow-cyan tabular-nums font-medium">
												{formatNumber(entry.score)}
											</span>
											{"mods" in entry && typeof entry.mods === "number" && entry.mods > 0 && (
												<ModIcons mods={entry.mods} />
											)}
										</div>
										<div>
											<span className="font-mono uppercase tracking-[0.1em] text-xs text-muted-foreground">
												Distance{" "}
											</span>
											<span className="font-mono text-foreground/80 tabular-nums">
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
