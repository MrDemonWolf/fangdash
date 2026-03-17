"use client";

import { SCORE_PER_SECOND, SCORE_PER_OBSTACLE } from "@fangdash/shared";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function AdminScoresPage() {
	const trpc = useTRPC();
	const qc = useQueryClient();
	const [page, setPage] = useState(1);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const { data, isPending } = useQuery(trpc.admin.getScores.queryOptions({ page, limit: 20 }));

	const deleteMutation = useMutation(
		trpc.admin.deleteScore.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.admin.getScores.queryKey() });
				setConfirmDelete(null);
			},
		}),
	);

	const totalPages = data ? Math.ceil(data.total / 20) : 1;

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-foreground">Scores</h2>
				<span className="text-sm text-muted-foreground">{data?.total ?? 0} total</span>
			</div>

			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead>Player</TableHead>
						<TableHead>Score</TableHead>
						<TableHead>Max Score</TableHead>
						<TableHead>Distance</TableHead>
						<TableHead>Obstacles</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isPending ? (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
								Loading...
							</TableCell>
						</TableRow>
					) : (
						(data?.items ?? []).map((s) => {
							const maxScore = Math.round(
								(s.duration / 1000) * SCORE_PER_SECOND + s.obstaclesCleared * SCORE_PER_OBSTACLE,
							);
							const isSuspicious = s.score > maxScore * 0.9;
							return (
								<TableRow key={s.id} className={cn(isSuspicious && "bg-amber-500/5")}>
									<TableCell className="font-medium text-foreground">{s.playerName}</TableCell>
									<TableCell
										className={cn(
											"font-mono font-bold",
											isSuspicious ? "text-amber-400" : "text-foreground",
										)}
									>
										{s.score.toLocaleString()}
										{isSuspicious && <span className="ml-1 text-xs">⚠</span>}
									</TableCell>
									<TableCell className="font-mono text-muted-foreground">
										{maxScore.toLocaleString()}
									</TableCell>
									<TableCell className="font-mono text-secondary-foreground">
										{(s.distance / 1000).toFixed(1)} km
									</TableCell>
									<TableCell className="font-mono text-secondary-foreground">
										{s.obstaclesCleared}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setConfirmDelete(s.id)}
											className="text-destructive hover:text-destructive"
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>

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

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={confirmDelete !== null}
				onOpenChange={(open) => !open && setConfirmDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Score?</DialogTitle>
						<DialogDescription>
							This will remove the score and update the player&apos;s aggregate stats.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setConfirmDelete(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => confirmDelete && deleteMutation.mutate({ scoreId: confirmDelete })}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
