"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function RoleBadge({ role }: { role: string | null }) {
	if (role === "admin") return <Badge variant="orange">admin</Badge>;
	if (role === "dev") return <Badge variant="purple">dev</Badge>;
	return <Badge variant="secondary">user</Badge>;
}

export default function AdminPlayersPage() {
	const trpc = useTRPC();
	const qc = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [banModal, setBanModal] = useState<{ userId: string; name: string } | null>(null);
	const [banReason, setBanReason] = useState("");
	const [banDuration, setBanDuration] = useState<string>("0");

	const handleSearch = (val: string) => {
		setSearch(val);
		clearTimeout((handleSearch as unknown as { _t: ReturnType<typeof setTimeout> })._t);
		(handleSearch as unknown as { _t: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
			setDebouncedSearch(val);
			setPage(1);
		}, 300);
	};

	const { data, isPending } = useQuery(
		trpc.admin.getPlayers.queryOptions({ page, limit: 20, search: debouncedSearch || undefined }),
	);

	const banMutation = useMutation(
		trpc.admin.banUser.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.admin.getPlayers.queryKey() });
				setBanModal(null);
				setBanReason("");
				setBanDuration("0");
			},
		}),
	);

	const unbanMutation = useMutation(
		trpc.admin.unbanUser.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.admin.getPlayers.queryKey() });
			},
		}),
	);

	const totalPages = data ? Math.ceil(data.total / 20) : 1;

	return (
		<div>
			<div className="mb-4 flex items-center gap-3">
				<Input
					placeholder="Search by name..."
					value={search}
					onChange={(e) => handleSearch(e.target.value)}
					className="w-64"
				/>
				<span className="text-sm text-muted-foreground">{data?.total ?? 0} players</span>
			</div>

			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Games</TableHead>
						<TableHead>Distance</TableHead>
						<TableHead>Joined</TableHead>
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
						(data?.items ?? []).map((p) => (
							<TableRow key={p.id}>
								<TableCell className="font-medium text-foreground">{p.name}</TableCell>
								<TableCell>
									<RoleBadge role={p.role} />
								</TableCell>
								<TableCell>
									{p.banned ? (
										<Badge variant="destructive">Banned</Badge>
									) : (
										<Badge variant="emerald">Active</Badge>
									)}
								</TableCell>
								<TableCell className="font-mono text-secondary-foreground">
									{p.gamesPlayed ?? 0}
								</TableCell>
								<TableCell className="font-mono text-secondary-foreground">
									{((p.totalDistance ?? 0) / 1000).toFixed(1)} km
								</TableCell>
								<TableCell className="text-muted-foreground">
									{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
								</TableCell>
								<TableCell className="text-right">
									{p.banned ? (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => unbanMutation.mutate({ userId: p.id })}
											className="text-emerald-400 hover:text-emerald-300"
										>
											Unban
										</Button>
									) : (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setBanModal({ userId: p.id, name: p.name })}
											className="text-destructive hover:text-destructive"
										>
											Ban
										</Button>
									)}
								</TableCell>
							</TableRow>
						))
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

			{/* Ban Dialog */}
			<Dialog
				open={banModal !== null}
				onOpenChange={(open) => {
					if (!open) {
						setBanModal(null);
						setBanReason("");
						setBanDuration("0");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ban {banModal?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 p-6 pt-0">
						<div>
							<label
								htmlFor="ban-reason"
								className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
							>
								Reason
							</label>
							<Input
								id="ban-reason"
								value={banReason}
								onChange={(e) => setBanReason(e.target.value)}
								placeholder="Optional reason..."
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
								Duration
							</label>
							<Select value={banDuration} onValueChange={setBanDuration}>
								<SelectTrigger aria-label="Ban duration">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">Permanent</SelectItem>
									<SelectItem value="1">1 day</SelectItem>
									<SelectItem value="7">7 days</SelectItem>
									<SelectItem value="30">30 days</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setBanModal(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								banModal &&
								banMutation.mutate({
									userId: banModal.userId,
									reason: banReason || undefined,
									durationDays: Number(banDuration),
								})
							}
							disabled={banMutation.isPending}
						>
							{banMutation.isPending ? "Banning..." : "Confirm Ban"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
