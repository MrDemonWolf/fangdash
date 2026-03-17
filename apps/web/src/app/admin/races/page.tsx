"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

function PlacementBadge({ placement }: { placement: number }) {
	if (placement === 1)
		return (
			<span className="rounded-full bg-yellow-500/20 px-2 py-0.5 font-mono text-xs font-bold text-yellow-400">
				1st
			</span>
		);
	if (placement === 2)
		return (
			<span className="rounded-full bg-gray-400/20 px-2 py-0.5 font-mono text-xs font-bold text-gray-300">
				2nd
			</span>
		);
	if (placement === 3)
		return (
			<span className="rounded-full bg-orange-600/20 px-2 py-0.5 font-mono text-xs font-bold text-orange-400">
				3rd
			</span>
		);
	return (
		<span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
			{placement}th
		</span>
	);
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
						<div
							key={group.raceId}
							className="overflow-hidden rounded-2xl border border-border bg-[#0a1628]/60 backdrop-blur-xl"
						>
							<div className="border-b border-border px-4 py-2">
								<span className="font-mono text-xs text-muted-foreground">
									Race: {group.raceId.slice(0, 8)}&hellip;
								</span>
								{group.entries[0]?.createdAt && (
									<span className="ml-3 text-xs text-gray-600">
										{new Date(group.entries[0].createdAt).toLocaleDateString()}
									</span>
								)}
							</div>
							<table className="w-full text-sm">
								<tbody className="divide-y divide-border/50">
									{group.entries.map((entry) => (
										<tr key={entry.id} className="transition hover:bg-muted/50">
											<td className="w-20 px-4 py-3">
												<PlacementBadge placement={entry.placement} />
											</td>
											<td className="px-4 py-3 font-medium text-foreground">{entry.playerName}</td>
											<td className="px-4 py-3 font-mono text-primary">
												{entry.score.toLocaleString()}
											</td>
											<td className="px-4 py-3 font-mono text-muted-foreground">
												{(entry.distance / 1000).toFixed(1)} km
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					))
				)}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
						className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground disabled:opacity-40 hover:text-foreground"
					>
						Prev
					</button>
					<span className="text-sm text-muted-foreground">
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
						className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground disabled:opacity-40 hover:text-foreground"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}
