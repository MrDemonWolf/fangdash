"use client";

import type { DifficultyName } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";

interface InGameLeaderboardProps {
  visible?: boolean;
  difficulty?: DifficultyName | undefined;
  mods?: number | undefined;
}

type View = "global" | "local";

export function InGameLeaderboard({
  visible = true,
  difficulty,
  mods,
}: InGameLeaderboardProps) {
  const [view, setView] = useState<View>("global");
  const trpc = useTRPC();

  const { data: globalEntries, isLoading: globalLoading } = useQuery(
    trpc.score.leaderboard.queryOptions(
      { limit: 10, difficulty, mods },
      { enabled: visible && view === "global" },
    ),
  );

  const { data: localEntries, isLoading: localLoading } = useQuery(
    trpc.score.leaderboard.queryOptions(
      { limit: 10, difficulty, mods },
      { enabled: visible && view === "local" },
    ),
  );

  if (!visible) return null;

  const entries = view === "global" ? globalEntries : localEntries;
  const isLoading = view === "global" ? globalLoading : localLoading;

  return (
    <div className="absolute right-2 top-14 z-10 w-44 rounded border border-[#0FACED]/20 bg-[#091533]/90 backdrop-blur-md pointer-events-auto">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {(["global", "local"] as View[]).map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
              view === v
                ? "text-[#0FACED] bg-[#0FACED]/10"
                : "text-white/30 hover:text-white/60",
            )}
          >
            {v}
          </button>
        ))}
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
          <p className="px-2 py-2 text-[10px] font-mono text-white/30 text-center">
            No scores yet
          </p>
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
                  entry.rank === 1
                    ? "text-yellow-400"
                    : entry.rank === 2
                    ? "text-slate-300"
                    : entry.rank === 3
                    ? "text-amber-600"
                    : "text-white/30",
                )}
              >
                {entry.rank}
              </span>
              <span className="flex-1 text-[10px] font-mono text-white/70 truncate">
                {entry.username ?? "Anon"}
              </span>
              <span className="text-[10px] font-mono font-bold tabular-nums text-[#0FACED] shrink-0">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
