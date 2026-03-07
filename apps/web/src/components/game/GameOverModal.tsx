"use client";

import Link from "next/link";
import type { GameState } from "@fangdash/shared";
import { getSkinById, getAchievementById } from "@fangdash/shared";

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
  onRetrySubmit?: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function subtitle(score: number): string {
  if (score >= 10000) return "Legendary run! 🔥";
  if (score >= 5000) return "Incredible effort!";
  if (score >= 1000) return "Great run!";
  if (score > 0) return "Nice effort!";
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
  onRetrySubmit,
}: GameOverModalProps) {
  const hasUnlocks =
    submitResult &&
    (submitResult.newAchievements.length > 0 ||
      submitResult.newSkins.length > 0);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)",
        }}
      />

      <div
        className="relative w-full max-w-sm mx-4 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0a1a3a 0%, #091533 100%)",
          border: "1px solid rgba(15,172,237,0.2)",
          boxShadow:
            "0 0 0 1px rgba(15,172,237,0.05), 0 8px 48px rgba(0,0,0,0.7), 0 0 60px rgba(15,172,237,0.07)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #0FACED, transparent)",
          }}
        />

        <div className="px-6 pt-8 pb-6">
          {/* GAME OVER heading */}
          <div className="text-center mb-6">
            <h2
              className="text-5xl font-black font-mono uppercase tracking-tight leading-none mb-2"
              style={{
                color: "#ff6b2b",
                textShadow:
                  "0 0 20px rgba(255,107,43,0.6), 0 0 40px rgba(255,107,43,0.25)",
              }}
            >
              Game Over
            </h2>
            <p className="text-sm font-mono text-white/50">
              {subtitle(state.score)}
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 space-y-2">
            {/* Score — hero row */}
            <div
              className="flex items-center justify-between rounded px-4 py-3"
              style={{
                background: "rgba(15,172,237,0.07)",
                border: "1px solid rgba(15,172,237,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-[#0FACED] flex-shrink-0"
                  style={{ boxShadow: "0 0 6px #0FACED" }}
                />
                <span className="text-sm font-mono text-white/60 uppercase tracking-wider">
                  Score
                </span>
              </div>
              <span
                className="text-xl font-bold font-mono tabular-nums text-[#0FACED]"
                style={{ textShadow: "0 0 10px rgba(15,172,237,0.5)" }}
              >
                {state.score.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between rounded px-4 py-2.5 bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/25 flex-shrink-0" />
                <span className="text-sm font-mono text-white/60 uppercase tracking-wider">
                  Distance
                </span>
              </div>
              <span className="text-lg font-bold font-mono tabular-nums text-white/80">
                {Math.floor(state.distance).toLocaleString()}m
              </span>
            </div>

            <div className="flex items-center justify-between rounded px-4 py-2.5 bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/25 flex-shrink-0" />
                <span className="text-sm font-mono text-white/60 uppercase tracking-wider">
                  Obstacles
                </span>
              </div>
              <span className="text-lg font-bold font-mono tabular-nums text-white/80">
                {state.obstaclesCleared.toLocaleString()}
              </span>
            </div>

            {elapsedTime !== undefined && (
              <div className="flex items-center justify-between rounded px-4 py-2.5 bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/25 flex-shrink-0" />
                  <span className="text-sm font-mono text-white/60 uppercase tracking-wider">
                    Time
                  </span>
                </div>
                <span className="text-lg font-bold font-mono tabular-nums text-white/80">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}
          </div>

          {/* Submit error */}
          {!!submitError && (
            <div className="mb-4 text-center">
              <p className="text-sm text-red-400 mb-2">Failed to save score.</p>
              {onRetrySubmit && (
                <button
                  type="button"
                  onClick={onRetrySubmit}
                  className="text-xs font-mono text-[#0FACED] underline hover:no-underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Saving indicator */}
          {isSignedIn && submitting && (
            <p className="mb-4 text-sm text-center font-mono text-white/40">
              Saving score...
            </p>
          )}

          {/* Unlocks */}
          {hasUnlocks && (
            <div
              className="mb-5 rounded p-4 space-y-3"
              style={{
                background: "rgba(255,196,0,0.06)",
                border: "1px solid rgba(255,196,0,0.2)",
              }}
            >
              {submitResult.newAchievements.length > 0 && (
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400/70 mb-2">
                    🏆 Achievements Unlocked
                  </p>
                  {submitResult.newAchievements.map((id) => {
                    const achievement = getAchievementById(id);
                    return (
                      <div key={id} className="flex items-center gap-2 py-0.5">
                        <span className="text-base leading-none">
                          {achievement?.icon ?? "⭐"}
                        </span>
                        <span className="text-sm font-mono text-white/80">
                          {achievement?.name ?? id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {submitResult.newSkins.length > 0 && (
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400/70 mb-2">
                    ✨ Skins Unlocked
                  </p>
                  {submitResult.newSkins.map((id) => {
                    const skin = getSkinById(id);
                    return (
                      <div key={id} className="flex items-center gap-2 py-0.5">
                        <span className="text-base leading-none">🐺</span>
                        <span className="text-sm font-mono text-white/80">
                          {skin?.name ?? id}
                        </span>
                        {skin && (
                          <span className="ml-auto text-xs font-mono text-yellow-400/50 capitalize">
                            {skin.rarity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sign-in nudge */}
          {isSignedIn === false && (
            <p className="mb-4 text-sm text-center font-mono text-white/40">
              Sign in to save scores &amp; unlock achievements
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="w-full cursor-pointer rounded px-6 py-3 text-sm font-black font-mono uppercase tracking-widest text-[#091533] transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "#0FACED",
                boxShadow:
                  "0 0 20px rgba(15,172,237,0.35), 0 0 40px rgba(15,172,237,0.12)",
              }}
            >
              Play Again
            </button>

            <Link
              href="/"
              className="block w-full rounded px-6 py-2.5 text-center text-xs font-mono uppercase tracking-widest text-white/40 border border-white/10 transition-colors hover:text-white/70 hover:border-white/20"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(15,172,237,0.3), transparent)",
          }}
        />
      </div>
    </div>
  );
}
