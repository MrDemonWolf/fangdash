"use client";

import type { GameState } from "@fangdash/shared";
import { getAchievementById, getSkinById } from "@fangdash/shared";
import Link from "next/link";
import { formatTime } from "@/lib/format-time.ts";

interface GameOverModalProps {
	state: GameState;
	elapsedTime?: number;
	onRestart: () => void;
	submitting?: boolean;
	submitResult?: {
		scoreId: string;
		newAchievements: string[];
		newSkins: string[];
		achievementError?: boolean;
		levelUp?: boolean;
		newLevel?: number;
	} | null;
	submitError?: unknown;
	isSignedIn?: boolean;
	cheatsUsed?: boolean;
	onRetrySubmit?: (() => void) | undefined;
}

function formatDistance(m: number): string {
	if (m >= 1000) {
		return `${(m / 1000).toFixed(1)}km`;
	}
	return `${Math.floor(m)}m`;
}

function subtitle(score: number): string {
	if (score >= 10000) {
		return "Legendary run! \u{1F525}";
	}
	if (score >= 5000) {
		return "Incredible effort!";
	}
	if (score >= 1000) {
		return "Great run!";
	}
	if (score > 0) {
		return "Nice effort!";
	}
	return "Better luck next time!";
}

export function GameOverModal({
	state,
	elapsedTime,
	onRestart,
	submitting,
	submitResult,
	submitError,
	isSignedIn,
	cheatsUsed,
	onRetrySubmit,
}: GameOverModalProps) {
	const hasUnlocks =
		submitResult && (submitResult.newAchievements.length > 0 || submitResult.newSkins.length > 0);

	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			{/* Scanline overlay */}
			<div className="scanlines absolute inset-0 pointer-events-none" />

			<div
				className="relative w-full max-w-sm mx-3 sm:mx-4 rounded-xl overflow-hidden max-h-[90dvh] overflow-y-auto glass"
				style={{
					border: "1px solid oklch(0.72 0.15 210 / 0.15)",
					boxShadow:
						"0 0 0 1px oklch(0.72 0.15 210 / 0.05), 0 8px 48px rgba(0,0,0,0.7), var(--glow-cyan)",
				}}
			>
				{/* Top accent line — fang slash gradient */}
				<div
					className="h-0.5 w-full"
					style={{
						background:
							"linear-gradient(90deg, transparent 10%, var(--color-fang-cyan), transparent 90%)",
					}}
				/>

				<div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
					{/* GAME OVER heading */}
					<div className="text-center mb-4 sm:mb-6">
						<h2 className="text-glow-orange text-4xl sm:text-5xl font-black font-mono uppercase tracking-tight leading-none mb-2 text-fang-orange">
							Game Over
						</h2>
						<p className="text-sm font-mono text-muted-foreground">{subtitle(state.score)}</p>
					</div>

					{/* Level Up banner */}
					{submitResult?.levelUp && submitResult.newLevel && (
						<div className="mb-3 sm:mb-4 rounded-lg px-4 py-3 text-center border border-primary/25 bg-primary/5">
							<p className="text-sm font-bold text-primary">
								Level Up! You are now level {submitResult.newLevel}!
							</p>
						</div>
					)}

					{/* Stats — 2x2 grid */}
					<div className="mb-4 sm:mb-6 grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-primary/10">
						{/* FINAL SCORE */}
						<div className="bg-[var(--color-surface-void)] px-3 sm:px-4 py-2.5 sm:py-3">
							<p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
								Final Score
							</p>
							<span className="text-glow-cyan text-xl sm:text-2xl font-black font-mono tabular-nums text-primary">
								{state.score.toLocaleString()}
							</span>
						</div>

						{/* DISTANCE */}
						<div className="bg-[var(--color-surface-void)] px-3 sm:px-4 py-2.5 sm:py-3">
							<p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
								Distance
							</p>
							<span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-foreground/80">
								{formatDistance(state.distance)}
							</span>
						</div>

						{/* DODGES */}
						<div className="bg-[var(--color-surface-void)] px-3 sm:px-4 py-2.5 sm:py-3">
							<p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
								Dodges
							</p>
							<span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-foreground/80">
								{state.obstaclesCleared.toLocaleString()}
							</span>
						</div>

						{/* TIME */}
						<div className="bg-[var(--color-surface-void)] px-3 sm:px-4 py-2.5 sm:py-3">
							<p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
								Time
							</p>
							<span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-foreground/80">
								{elapsedTime !== undefined ? formatTime(elapsedTime) : "--:--"}
							</span>
						</div>
					</div>

					{/* Cheats active notice */}
					{cheatsUsed && (
						<div className="mb-3 sm:mb-4 rounded-lg px-4 py-3 text-center border border-fang-orange/25 bg-fang-orange/5">
							<p className="text-sm font-bold text-fang-orange">
								Score not saved — cheats were active
							</p>
						</div>
					)}

					{/* Submit error */}
					{!cheatsUsed && !!submitError && (
						<div className="mb-3 sm:mb-4 text-center">
							<p className="text-sm text-destructive mb-2">Failed to save score.</p>
							{onRetrySubmit && (
								<button
									type="button"
									onClick={onRetrySubmit}
									className="text-xs font-mono text-primary underline hover:no-underline"
								>
									Try again
								</button>
							)}
						</div>
					)}

					{/* Saving indicator */}
					{isSignedIn && !cheatsUsed && submitting && (
						<p className="mb-3 sm:mb-4 text-sm text-center font-mono text-muted-foreground">
							Saving score...
						</p>
					)}

					{/* Unlocks — horizontal pill badges */}
					{hasUnlocks && (
						<div className="mb-4 sm:mb-5">
							<p className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-fang-gold/70 mb-2">
								Unlocked
							</p>
							<div className="flex flex-wrap gap-2">
								{submitResult.newAchievements.map((id) => {
									const achievement = getAchievementById(id);
									return (
										<span
											key={id}
											className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono border border-fang-gold/25 bg-fang-gold/5 text-fang-gold shadow-[var(--glow-gold)]"
										>
											{"🏆"} {achievement?.name ?? id}
										</span>
									);
								})}
								{submitResult.newSkins.map((id) => {
									const skin = getSkinById(id);
									return (
										<span
											key={id}
											className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono border border-fang-gold/25 bg-fang-gold/5 text-fang-gold shadow-[var(--glow-gold)]"
										>
											{"🐺"} {skin?.name ?? id}
										</span>
									);
								})}
							</div>
						</div>
					)}

					{/* Achievement sync warning */}
					{submitResult?.achievementError && (
						<p className="mb-3 sm:mb-4 text-xs text-center font-mono text-fang-gold/50">
							Some achievements may not have been recorded. They&apos;ll sync next game.
						</p>
					)}

					{/* Sign-in nudge */}
					{isSignedIn === false && (
						<p className="mb-3 sm:mb-4 text-sm text-center font-mono text-muted-foreground">
							Sign in to save scores &amp; unlock achievements
						</p>
					)}

					{/* Buttons */}
					<div className="flex flex-col gap-2.5">
						<button
							type="button"
							onClick={onRestart}
							className="w-full cursor-pointer rounded-lg px-6 py-3.5 text-sm font-black font-mono uppercase tracking-[0.15em] text-primary-foreground bg-primary transition-all hover:brightness-110 active:scale-[0.97] animate-pulse-glow"
						>
							PLAY AGAIN
						</button>

						<Link
							href="/"
							className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground/50 hover:text-muted-foreground transition-colors text-center block w-full py-2"
						>
							&lt; Back to Home &gt;
						</Link>
					</div>
				</div>

				{/* Bottom accent line */}
				<div
					className="h-px w-full"
					style={{
						background:
							"linear-gradient(90deg, transparent, oklch(0.72 0.15 210 / 0.2), transparent)",
					}}
				/>
			</div>
		</div>
	);
}
