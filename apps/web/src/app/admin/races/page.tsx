"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function PlacementBadge({ placement }: { placement: number }) {
	if (placement === 1) return <Badge variant="gold">1st</Badge>;
	if (placement === 2) return <Badge variant="silver">2nd</Badge>;
	if (placement === 3) return <Badge variant="bronze">3rd</Badge>;
	return <Badge variant="secondary">{placement}th</Badge>;
}

export default function AdminRacesPage() {
	const trpc = useTRPC();
	const [page, setPage] = useState(1);

	const { data, isPending } = useQuery(trpc.admin.getRaces.queryOptions({ page, limit: 20 }));

	const totalPages = data ? Math.ceil(data.total / 20) : 1;

	// Group items by raceId for visual grouping
	type RaceItem = NonNullable<typeof data>["items"][number];
	const grouped: Array<{ raceId: string; entries: RaceItem[] }> = [];
	for (const item of data?.items ?? []) {
		const last = grouped[grouped.length - 1];
		if (last && last.raceId === item.raceId) {
			last.entries.push(item);
		} else {
			grouped.push({ raceId: item.raceId, entries: [item] });
		}
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-foreground">Races</h2>
				<span className="text-sm text-muted-foreground">{data?.total ?? 0} entries</span>
			</div>

			<div className="space-y-4">
				{isPending ? (
					<div className="py-8 text-center text-muted-foreground">Loading...</div>
				) : (
					grouped.map((group) => (
						<Card key={group.raceId}>
							<CardHeader className="flex-row items-center gap-3 py-2 px-4">
								<span className="font-mono text-xs text-muted-foreground">
									Race: {group.raceId.slice(0, 8)}&hellip;
								</span>
								{group.entries[0]?.createdAt && (
									<span className="text-xs text-muted-foreground">
										{new Date(group.entries[0].createdAt).toLocaleDateString()}
									</span>
								)}
							</CardHeader>
							<CardContent className="p-0">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="w-20">Place</TableHead>
											<TableHead>Player</TableHead>
											<TableHead>Score</TableHead>
											<TableHead>Distance</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{group.entries.map((entry) => (
											<TableRow key={entry.id}>
												<TableCell className="w-20">
													<PlacementBadge placement={entry.placement} />
												</TableCell>
												<TableCell className="font-medium text-foreground">
													{entry.playerName}
												</TableCell>
												<TableCell className="font-mono text-primary">
													{entry.score.toLocaleString()}
												</TableCell>
												<TableCell className="font-mono text-muted-foreground">
													{(entry.distance / 1000).toFixed(1)} km
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						Prev
					</Button>
					<span className="text-sm text-muted-foreground">
						{page} / {totalPages}
					</span>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
