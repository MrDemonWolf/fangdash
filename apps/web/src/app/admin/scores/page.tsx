"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { SCORE_PER_SECOND, SCORE_PER_OBSTACLE } from "@fangdash/shared";

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
    })
  );

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Scores</h2>
        <span className="text-sm text-gray-400">{data?.total ?? 0} total</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Player</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Score</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Max Score</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Distance</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Obstacles</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isPending ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : (data?.items ?? []).map((s) => {
              const maxScore = Math.round((s.duration / 1000) * SCORE_PER_SECOND + s.obstaclesCleared * SCORE_PER_OBSTACLE);
              const isSuspicious = s.score > maxScore * 0.9;
              return (
                <tr key={s.id} className={`transition hover:bg-white/5 ${isSuspicious ? "bg-amber-500/5" : ""}`}>
                  <td className="px-4 py-3 font-medium text-white">{s.playerName}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${isSuspicious ? "text-amber-400" : "text-white"}`}>
                    {s.score.toLocaleString()}
                    {isSuspicious && <span className="ml-1 text-xs">⚠</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{maxScore.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{(s.distance / 1000).toFixed(1)} km</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{s.obstaclesCleared}</td>
                  <td className="px-4 py-3 text-gray-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 disabled:opacity-40 hover:text-white">
            Prev
          </button>
          <span className="text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 disabled:opacity-40 hover:text-white">
            Next
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a1628] p-6">
            <h3 className="mb-2 text-lg font-bold text-white">Delete Score?</h3>
            <p className="mb-6 text-sm text-gray-400">This will remove the score and update the player&apos;s aggregate stats.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ scoreId: confirmDelete })}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
