"use client";

import type { DifficultyName } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import { rankColorClass } from "@/lib/format.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";

interface InGameLeaderboardProps {
	visible?: boolean;
	difficulty?: DifficultyName | undefined;
	mods?: number | undefined;
}

export function InGameLeaderboard({ visible = true, difficulty, mods }: InGameLeaderboardProps) {
	const trpc = useTRPC();

	const { data: entries, isLoading } = useQuery(
		trpc.score.leaderboard.queryOptions({ limit: 10, difficulty, mods }, { enabled: visible }),
	);

	if (!visible) return null;

	return (
		<div className="absolute right-2 top-14 z-10 w-44 rounded border border-fang-cyan/20 bg-[#091533]/90 backdrop-blur-md pointer-events-auto">
			{/* Header */}
			<div className="border-b border-white/10 py-1.5 text-center text-[10px] font-mono uppercase tracking-widest text-fang-cyan">
				Top 10
			</div>

			{/* Entries */}
			<div className="py-1">
				{isLoading &&
					Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-1.5 px-2 py-1">
							<div className="w-4 h-2 rounded bg-white/10 animate-pulse" />
							<div className="flex-1 h-2 rounded bg-white/10 animate-pulse" />
							<div className="w-8 h-2 rounded bg-white/10 animate-pulse" />
						</div>
					))}

				{!isLoading && (!entries || entries.length === 0) && (
					<p className="px-2 py-2 text-[10px] font-mono text-white/60 text-center">No scores yet</p>
				)}

				{!isLoading &&
					entries?.map((entry) => (
						<div
							key={entry.scoreId}
							className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 transition-colors"
						>
							<span
								className={cn(
									"w-4 text-center text-[10px] font-mono font-bold shrink-0",
									rankColorClass(entry.rank),
								)}
							>
								{entry.rank}
							</span>
							<span className="flex-1 text-[10px] font-mono text-white/70 truncate">
								{entry.username ?? "Anon"}
							</span>
							<span className="text-[10px] font-mono font-bold tabular-nums text-fang-cyan shrink-0">
								{entry.score.toLocaleString()}
							</span>
						</div>
					))}
			</div>
		</div>
	);
}
