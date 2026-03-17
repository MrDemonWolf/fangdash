"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

function RoleBadge({ role }: { role: string | null }) {
	if (role === "admin")
		return (
			<span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
				admin
			</span>
		);
	return (
		<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-gray-400">
			user
		</span>
	);
}

export default function AdminPlayersPage() {
	const trpc = useTRPC();
	const qc = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [banModal, setBanModal] = useState<{ userId: string; name: string } | null>(null);
	const [banReason, setBanReason] = useState("");
	const [banDuration, setBanDuration] = useState<number>(0);

	// Debounce search
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
				setBanDuration(0);
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
				<input
					type="text"
					placeholder="Search by name..."
					value={search}
					onChange={(e) => handleSearch(e.target.value)}
					className="rounded-lg border border-white/10 bg-[#0a1628] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#0FACED]/50 focus:outline-none"
				/>
				<span className="text-sm text-gray-400">{data?.total ?? 0} players</span>
			</div>

			<div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-white/10">
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Name
							</th>
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Role
							</th>
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Status
							</th>
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Games
							</th>
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Distance
							</th>
							<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
								Joined
							</th>
							<th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-white/5">
						{isPending ? (
							<tr>
								<td colSpan={7} className="px-4 py-8 text-center text-gray-500">
									Loading...
								</td>
							</tr>
						) : (
							(data?.items ?? []).map((p) => (
								<tr key={p.id} className="transition hover:bg-white/5">
									<td className="px-4 py-3 font-medium text-white">{p.name}</td>
									<td className="px-4 py-3">
										<RoleBadge role={p.role} />
									</td>
									<td className="px-4 py-3">
										{p.banned ? (
											<span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400">
												Banned
											</span>
										) : (
											<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
												Active
											</span>
										)}
									</td>
									<td className="px-4 py-3 font-mono text-gray-300">{p.gamesPlayed ?? 0}</td>
									<td className="px-4 py-3 font-mono text-gray-300">
										{((p.totalDistance ?? 0) / 1000).toFixed(1)} km
									</td>
									<td className="px-4 py-3 text-gray-500">
										{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
									</td>
									<td className="px-4 py-3 text-right">
										{p.banned ? (
											<button
												onClick={() => unbanMutation.mutate({ userId: p.id })}
												className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
											>
												Unban
											</button>
										) : (
											<button
												onClick={() => setBanModal({ userId: p.id, name: p.name })}
												className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
											>
												Ban
											</button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
						className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 disabled:opacity-40 hover:text-white"
					>
						Prev
					</button>
					<span className="text-sm text-gray-400">
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
						className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 disabled:opacity-40 hover:text-white"
					>
						Next
					</button>
				</div>
			)}

			{/* Ban Modal */}
			{banModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1628] p-6">
						<h3 className="mb-4 text-lg font-bold text-white">Ban {banModal.name}</h3>
						<div className="mb-4">
							<label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">
								Reason
							</label>
							<input
								type="text"
								value={banReason}
								onChange={(e) => setBanReason(e.target.value)}
								placeholder="Optional reason..."
								className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#0FACED]/50 focus:outline-none"
							/>
						</div>
						<div className="mb-6">
							<label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">
								Duration
							</label>
							<select
								value={banDuration}
								onChange={(e) => setBanDuration(Number(e.target.value))}
								className="w-full rounded-lg border border-white/10 bg-[#0a1628] px-3 py-2 text-sm text-white focus:border-[#0FACED]/50 focus:outline-none"
							>
								<option value={0}>Permanent</option>
								<option value={1}>1 day</option>
								<option value={7}>7 days</option>
								<option value={30}>30 days</option>
							</select>
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => setBanModal(null)}
								className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
							>
								Cancel
							</button>
							<button
								onClick={() =>
									banMutation.mutate({
										userId: banModal.userId,
										reason: banReason || undefined,
										durationDays: banDuration,
									})
								}
								disabled={banMutation.isPending}
								className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
							>
								{banMutation.isPending ? "Banning..." : "Confirm Ban"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
