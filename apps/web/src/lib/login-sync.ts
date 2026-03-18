"use client";

import type { DifficultyName } from "@fangdash/shared";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client.ts";
import { addNotification } from "@/lib/notification-store.ts";
import { getAllPendingScores, removePendingScore } from "@/lib/score-store.ts";
import { trpcVanilla } from "@/lib/trpc-provider.tsx";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useLoginSync() {
	const { data: session } = useSession();
	const isSignedIn = !!session?.user;
	const hasSynced = useRef(false);

	useEffect(() => {
		if (!isSignedIn) {
			hasSynced.current = false;
			return;
		}
		if (hasSynced.current) return;
		hasSynced.current = true;

		syncPendingScores();

		async function syncPendingScores() {
			try {
				const pending = await getAllPendingScores();
				if (pending.length === 0) return;

				const now = Date.now();
				const eligible = pending.filter(
					(s) => !s.payload.cheated && now - s.createdAt < SEVEN_DAYS_MS && s.status !== "syncing",
				);

				if (eligible.length === 0) {
					// Clean up expired entries
					for (const entry of pending) {
						if (now - entry.createdAt >= SEVEN_DAYS_MS && entry.id) {
							await removePendingScore(entry.id);
						}
					}
					return;
				}

				const scores = eligible.slice(0, 20).map((s) => ({
					score: s.payload.score,
					distance: s.payload.distance,
					obstaclesCleared: s.payload.obstaclesCleared,
					longestCleanRun: s.payload.longestCleanRun,
					duration: s.payload.duration,
					seed: s.payload.seed,
					difficulty: s.payload.difficulty as DifficultyName,
					mods: s.payload.mods,
					cheated: s.payload.cheated,
					clientTimestamp: s.createdAt,
				}));

				const results = await trpcVanilla.score.batchSync.mutate({ scores });

				let syncedCount = 0;
				for (let i = 0; i < results.length; i++) {
					const result = results[i]!;
					const entry = eligible[result.clientIndex]!;
					if ((result.status === "ok" || result.status === "rejected") && entry.id) {
						await removePendingScore(entry.id);
						if (result.status === "ok") syncedCount++;
					}
				}

				// Clean up remaining expired
				for (const entry of pending) {
					if (now - entry.createdAt >= SEVEN_DAYS_MS && entry.id) {
						await removePendingScore(entry.id);
					}
				}

				if (syncedCount > 0) {
					toast.success(
						`${syncedCount} score${syncedCount > 1 ? "s" : ""} synced from offline play`,
					);
					addNotification({
						type: "score_synced",
						title: "Scores Synced",
						description: `${syncedCount} score${syncedCount > 1 ? "s" : ""} from offline play ${syncedCount > 1 ? "have" : "has"} been synced.`,
					});
				}
			} catch (err) {
				console.error("[LoginSync] Failed to sync pending scores:", err);
			}
		}
	}, [isSignedIn]);
}
