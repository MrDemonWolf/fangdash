"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

function StatCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: string | number;
	accent: string;
}) {
	return (
		<Card>
			<CardContent className="p-6">
				<p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
					{label}
				</p>
				<p className={cn("font-mono text-3xl font-bold", accent)}>
					{typeof value === "number" ? value.toLocaleString() : value}
				</p>
			</CardContent>
		</Card>
	);
}

export default function AdminOverviewPage() {
	const trpc = useTRPC();
	const { data: stats, isPending } = useQuery(trpc.admin.getStats.queryOptions());

	return (
		<div>
			<h2 className="mb-4 text-lg font-semibold text-foreground">Overview</h2>
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
				<StatCard
					label="Total Players"
					value={isPending ? "—" : (stats?.totalPlayers ?? 0)}
					accent="text-primary"
				/>
				<StatCard
					label="Games Played"
					value={isPending ? "—" : (stats?.totalGamesPlayed ?? 0)}
					accent="text-fang-purple"
				/>
				<StatCard
					label="Meters Run"
					value={isPending ? "—" : (stats?.totalMeters ?? 0)}
					accent="text-emerald-400"
				/>
				<StatCard
					label="Distinct Races"
					value={isPending ? "—" : (stats?.distinctRaces ?? 0)}
					accent="text-fang-orange"
				/>
				<StatCard
					label="Race Entries"
					value={isPending ? "—" : (stats?.totalRaceEntries ?? 0)}
					accent="text-fang-gold"
				/>
			</div>
		</div>
	);
}
