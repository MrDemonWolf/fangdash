"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 p-6 backdrop-blur-xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`font-mono text-3xl font-bold ${accent}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const trpc = useTRPC();
  const { data: stats, isPending } = useQuery(trpc.admin.getStats.queryOptions());

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Overview</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Players" value={isPending ? "—" : (stats?.totalPlayers ?? 0)} accent="text-[#0FACED]" />
        <StatCard label="Games Played" value={isPending ? "—" : (stats?.totalGamesPlayed ?? 0)} accent="text-purple-400" />
        <StatCard label="Meters Run" value={isPending ? "—" : (stats?.totalMeters ?? 0)} accent="text-emerald-400" />
        <StatCard label="Distinct Races" value={isPending ? "—" : (stats?.distinctRaces ?? 0)} accent="text-orange-400" />
        <StatCard label="Race Entries" value={isPending ? "—" : (stats?.totalRaceEntries ?? 0)} accent="text-yellow-400" />
      </div>
    </div>
  );
}
