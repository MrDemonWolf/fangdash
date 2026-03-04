"use client";

import Link from "next/link";
import type { GameState } from "@fangdash/shared";

interface GameOverModalProps {
  state: GameState;
  elapsedTime?: number;
  onRestart: () => void;
  submitting?: boolean;
  submitResult?: {
    scoreId: string;
    newAchievements: string[];
    newSkins: string[];
  } | null;
  submitError?: unknown;
  isSignedIn?: boolean;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function GameOverModal({
  state,
  elapsedTime,
  onRestart,
  submitting,
  submitResult,
  submitError,
  isSignedIn,
}: GameOverModalProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-xl border border-white/10 bg-[#091533]/95 p-8 shadow-2xl shadow-[#0FACED]/10">
        <h2 className="mb-1 text-center text-3xl font-extrabold tracking-tight text-[var(--color-fang-orange)]">
          Game Over
        </h2>
        <p className="mb-6 text-center text-sm text-white/50">
          Better luck next time!
        </p>

        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-white/70">Score</span>
            <span className="text-lg font-bold tabular-nums text-[#0FACED]">
              {state.score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-white/70">Distance</span>
            <span className="text-lg font-bold tabular-nums text-white">
              {Math.floor(state.distance).toLocaleString()}m
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-white/70">
              Obstacles Cleared
            </span>
            <span className="text-lg font-bold tabular-nums text-white">
              {state.obstaclesCleared.toLocaleString()}
            </span>
          </div>

          {elapsedTime !== undefined && (
            <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
              <span className="text-sm font-medium text-white/70">Time</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}
        </div>

        {!!submitError && (
          <p className="mb-4 text-sm text-center text-red-400">Failed to save score. Please try again.</p>
        )}

        {isSignedIn && submitting && (
          <p className="mb-4 text-sm text-center text-gray-400">Saving score...</p>
        )}

        {submitResult &&
          (submitResult.newAchievements.length > 0 ||
            submitResult.newSkins.length > 0) && (
            <div className="mb-6 rounded-lg border border-[var(--color-fang-gold)]/40 bg-[var(--color-fang-gold)]/10 p-4">
              {submitResult.newAchievements.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-semibold text-[var(--color-fang-gold)]">
                    New Achievements!
                  </p>
                  {submitResult.newAchievements.map((id) => (
                    <p key={id} className="text-sm text-gray-300">
                      {id}
                    </p>
                  ))}
                </div>
              )}
              {submitResult.newSkins.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--color-fang-gold)]">
                    New Skins Unlocked!
                  </p>
                  {submitResult.newSkins.map((id) => (
                    <p key={id} className="text-sm text-gray-300">
                      {id}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

        {isSignedIn === false && (
          <p className="mb-4 text-sm text-center text-gray-400">
            Sign in to save your scores and unlock achievements!
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="w-full cursor-pointer rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
          >
            Play Again
          </button>

          <Link
            href="/"
            className="block w-full rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
