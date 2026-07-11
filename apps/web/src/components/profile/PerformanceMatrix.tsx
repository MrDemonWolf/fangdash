import { formatDistance } from "@/lib/format.ts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricTile {
	label: string;
	value: string;
	accent: string;
}

/** Build the standard 6-tile performance matrix shared by both profile pages. */
export function buildPerformanceTiles(stats: {
	totalDistance: number;
	highScore: number;
	winRate: string;
	obstacles: number;
	gamesPlayed: number;
	totalScore: number;
}): MetricTile[] {
	return [
		{ label: "Total Distance", value: formatDistance(stats.totalDistance), accent: "text-primary" },
		{ label: "High Score", value: stats.highScore.toLocaleString(), accent: "text-primary" },
		{ label: "Win Rate", value: stats.winRate, accent: "text-emerald-400" },
		{ label: "Obstacles", value: stats.obstacles.toLocaleString(), accent: "text-fang-orange" },
		{
			label: "Games Played",
			value: stats.gamesPlayed.toLocaleString(),
			accent: "text-fang-purple",
		},
		{ label: "Total Score", value: stats.totalScore.toLocaleString(), accent: "text-fang-gold" },
	];
}

export function PerformanceMatrix({ tiles }: { tiles: MetricTile[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Performance Matrix</CardTitle>
			</CardHeader>
			<div className="grid grid-cols-2 gap-px bg-border/50 p-px">
				{tiles.map((tile) => (
					<div
						key={tile.label}
						className="rounded-xl border border-transparent bg-card p-4 transition-all hover:border-primary/30"
					>
						<p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
							{tile.label}
						</p>
						<p className={cn("font-mono text-2xl font-bold", tile.accent)}>{tile.value}</p>
					</div>
				))}
			</div>
		</Card>
	);
}
