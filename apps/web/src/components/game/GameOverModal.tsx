"use client";

import Link from "next/link";
import type { GameState } from "@fangdash/shared";

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export function GameOverModal({ state, onRestart }: GameOverModalProps) {
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
        </div>

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
