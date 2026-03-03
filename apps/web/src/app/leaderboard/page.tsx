"use client";

import { useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

type Tab = "daily" | "weekly" | "all-time";

const TABS: { key: Tab; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "all-time", label: "All Time" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300/20 text-gray-300 font-bold text-sm">
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 font-bold text-sm">
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-gray-400 font-medium text-sm">
      {rank}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white/5 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
      <div className="mt-3 flex gap-4">
        <div className="h-4 w-16 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
    </div>
  );
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
  const trpc = useTRPC();
  const { data: session } = useSession();

  const leaderboardQuery = useQuery(
    trpc.score.leaderboard.queryOptions({ limit: 50 })
  );

  const entries = leaderboardQuery.data ?? [];
  const currentUsername = session?.user?.name;

  return (
    <main className="min-h-screen bg-[#091533] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-gray-400">
          Top runners in FangDash
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-white/5 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#0FACED]/20 text-[#0FACED]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="mt-6 hidden sm:block overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="px-4 py-3 font-medium w-16">Rank</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Distance</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardQuery.isLoading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {!leaderboardQuery.isLoading && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No scores yet. Be the first to play!
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                const isCurrentUser =
                  currentUsername != null &&
                  entry.username === currentUsername;
                return (
                  <tr
                    key={entry.scoreId}
                    className={`border-b border-white/5 transition-colors ${
                      isCurrentUser
                        ? "bg-[#0FACED]/10 border-[#0FACED]/20"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-[#0FACED]">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white tabular-nums">
                      {formatNumber(entry.score)}
                    </td>
                    <td className="px-4 py-3 text-gray-300 tabular-nums">
                      {formatNumber(Math.round(entry.distance))}m
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="mt-6 flex flex-col gap-3 sm:hidden">
          {leaderboardQuery.isLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
          {!leaderboardQuery.isLoading && entries.length === 0 && (
            <div className="rounded-lg bg-white/5 px-4 py-12 text-center text-gray-500">
              No scores yet. Be the first to play!
            </div>
          )}
          {entries.map((entry) => {
            const isCurrentUser =
              currentUsername != null &&
              entry.username === currentUsername;
            return (
              <div
                key={entry.scoreId}
                className={`rounded-lg p-4 ${
                  isCurrentUser
                    ? "bg-[#0FACED]/10 border border-[#0FACED]/20"
                    : "bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={entry.rank} />
                  <span className="font-medium text-white">
                    {entry.username}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-[#0FACED]">
                        (you)
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Score </span>
                    <span className="text-white tabular-nums font-medium">
                      {formatNumber(entry.score)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Distance </span>
                    <span className="text-gray-300 tabular-nums">
                      {formatNumber(Math.round(entry.distance))}m
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {formatDate(entry.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
