import { formatDistance } from "@/lib/format.ts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ScoreEntry {
	id: string;
	score: number;
	distance: number;
	obstaclesCleared: number;
	difficulty?: string;
	createdAt: string | Date;
}

export function TrendArrow({ trend }: { trend: "up" | "down" | "same" }) {
	if (trend === "up") {
		return <span className="font-mono text-xl font-bold text-emerald-400">↑</span>;
	}
	if (trend === "down") {
		return <span className="font-mono text-xl font-bold text-red-400">↓</span>;
	}
	return <span className="font-mono text-xl font-bold text-muted-foreground">—</span>;
}

interface RecentScorelinesProps {
	scores: ScoreEntry[];
	title?: string;
	emptyText?: string;
}

export function RecentScorelines({
	scores,
	title = "Recent Scorelines",
	emptyText = "No scores yet.",
}: RecentScorelinesProps) {
	const top8 = scores.slice(0, 8);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>

			{top8.length === 0 ? (
				<CardContent className="py-8 text-center text-sm text-muted-foreground">
					{emptyText}
				</CardContent>
			) : (
				<ul className="divide-y divide-border/50">
					{top8.map((entry, i) => {
						const next = top8[i + 1];
						const trend: "up" | "down" | "same" =
							next === undefined
								? "same"
								: entry.score > next.score
									? "up"
									: entry.score < next.score
										? "down"
										: "same";

						return (
							<li
								key={entry.id}
								className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/30"
							>
								<TrendArrow trend={trend} />
								<div className="flex flex-1 flex-col gap-0.5">
									<span className="font-mono font-bold text-foreground">
										{entry.score.toLocaleString()}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatDistance(entry.distance)}
										{entry.difficulty ? ` · ${entry.difficulty}` : ""} ·{" "}
										{new Date(entry.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
								{entry.obstaclesCleared > 0 && (
									<Badge variant="orange" className="font-mono">
										{entry.obstaclesCleared}
									</Badge>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Card>
	);
}
