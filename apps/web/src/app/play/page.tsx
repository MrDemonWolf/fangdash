"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OnboardingOverlay from "@/components/game/OnboardingOverlay";
import type { GameState } from "@fangdash/shared";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Inline GameHUD (local version until the shared component lands)
// ---------------------------------------------------------------------------
function GameHUD({
  score,
  distance,
  elapsedTime,
}: {
  score: number;
  distance: number;
  elapsedTime: number;
}) {
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4 text-white">
      <div className="flex items-center gap-6 text-lg font-semibold">
        <span>
          Score: <span className="text-[#0FACED]">{score}</span>
        </span>
        <span>
          Distance:{" "}
          <span className="text-[#0FACED]">{Math.floor(distance)}m</span>
        </span>
      </div>
      <div className="text-lg font-semibold">
        Time: <span className="text-[#0FACED]">{formatTime(elapsedTime)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline GameOverModal (local version until the shared component lands)
// ---------------------------------------------------------------------------
function GameOverModal({
  state,
  elapsedTime,
  onRestart,
  submitting,
  submitResult,
  isSignedIn,
}: {
  state: GameState;
  elapsedTime: number;
  onRestart: () => void;
  submitting: boolean;
  submitResult: {
    scoreId: string;
    newAchievements: string[];
    newSkins: string[];
  } | null;
  isSignedIn: boolean;
}) {
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[#0FACED]/30 bg-[#091533] p-8 text-center shadow-2xl">
        <h2 className="mb-6 text-3xl font-bold text-white">Game Over</h2>

        <div className="mb-6 space-y-2 text-lg text-gray-300">
          <p>
            Score:{" "}
            <span className="font-semibold text-[#0FACED]">{state.score}</span>
          </p>
          <p>
            Distance:{" "}
            <span className="font-semibold text-[#0FACED]">
              {Math.floor(state.distance)}m
            </span>
          </p>
          <p>
            Obstacles Cleared:{" "}
            <span className="font-semibold text-[#0FACED]">
              {state.obstaclesCleared}
            </span>
          </p>
          <p>
            Time:{" "}
            <span className="font-semibold text-[#0FACED]">
              {formatTime(elapsedTime)}
            </span>
          </p>
        </div>

        {isSignedIn && submitting && (
          <p className="mb-4 text-sm text-gray-400">Saving score...</p>
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

        {!isSignedIn && (
          <p className="mb-4 text-sm text-gray-400">
            Sign in to save your scores and unlock achievements!
          </p>
        )}

        <button
          onClick={onRestart}
          className="rounded-lg bg-[#0FACED] px-8 py-3 font-semibold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Play Page
// ---------------------------------------------------------------------------
export default function PlayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    distance: 0,
    obstaclesCleared: 0,
    alive: true,
    speed: 0,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalState, setFinalState] = useState<GameState | null>(null);
  const [finalElapsedTime, setFinalElapsedTime] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

  // Fetch equipped skin (only when signed in)
  const trpc = useTRPC();
  const { data: skinData } = useQuery(
    trpc.skin.getEquippedSkin.queryOptions(undefined, {
      enabled: isSignedIn,
    })
  );

  // Score submission mutation
  const {
    mutate: submitScore,
    data: submitResult,
    isPending: submitting,
  } = useMutation(
    trpc.score.submit.mutationOptions({
      onError: (err) => {
        console.error("Failed to submit score:", err);
      },
    })
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
  }, [stopTimer]);

  const handleGameOver = useCallback(
    (state: GameState) => {
      stopTimer();
      const duration = Date.now() - startTimeRef.current;
      setFinalState(state);
      setFinalElapsedTime(duration);
      setGameOver(true);

      if (isSignedIn) {
        submitScore({
          score: state.score,
          distance: state.distance,
          obstaclesCleared: state.obstaclesCleared,
          duration,
          seed: Date.now().toString(),
        });
      }
    },
    [isSignedIn, stopTimer, submitScore]
  );

  const startGame = useCallback(async () => {
    if (!containerRef.current) return;

    // Dynamically import Phaser game (not available during SSR)
    const { createGame, destroyGame } = await import("@fangdash/game");

    // Clean up previous game
    if (gameRef.current) {
      destroyGame(gameRef.current);
      gameRef.current = null;
    }

    // Reset state
    setGameOver(false);
    setFinalState(null);
    setFinalElapsedTime(0);
    setGameState({
      score: 0,
      distance: 0,
      obstaclesCleared: 0,
      alive: true,
      speed: 0,
    });

    const game = createGame({
      parent: containerRef.current,
      skinKey: skinData?.skinId,
      onStateUpdate: (state) => {
        setGameState(state);
      },
      onGameOver: handleGameOver,
    });

    gameRef.current = game;
    startTimer();
  }, [skinData?.skinId, handleGameOver, startTimer]);

  // Check onboarding status on mount
  useEffect(() => {
    const done = localStorage.getItem("fangdash_onboarding_complete");
    setShowOnboarding(done !== "true");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("fangdash_onboarding_complete", "true");
    setShowOnboarding(false);
  }, []);

  // Start game on mount (wait for skin data if signed in, wait for onboarding)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    // Wait for onboarding check to complete
    if (showOnboarding === null) return;
    // Don't start if onboarding is showing
    if (showOnboarding) return;
    // If signed in, wait for skin data before starting
    if (isSignedIn && !skinData) return;

    hasInitialized.current = true;
    startGame();
  }, [isSignedIn, skinData, startGame, showOnboarding]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (gameRef.current) {
        import("@fangdash/game").then(({ destroyGame }) => {
          if (gameRef.current) {
            destroyGame(gameRef.current);
            gameRef.current = null;
          }
        });
      }
    };
  }, [stopTimer]);

  const handleRestart = useCallback(() => {
    hasInitialized.current = false;
    startGame();
    hasInitialized.current = true;
  }, [startGame]);

  return (
    <main className="flex flex-col bg-[#091533]">
      <div className="relative w-full h-[calc(100vh-64px)]">
        {/* HUD overlay */}
        {!gameOver && (
          <GameHUD
            score={gameState.score}
            distance={gameState.distance}
            elapsedTime={elapsedTime}
          />
        )}

        {/* Game canvas container */}
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden"
        />

        {/* Onboarding overlay */}
        {showOnboarding && (
          <OnboardingOverlay onComplete={handleOnboardingComplete} />
        )}

        {/* Game Over modal */}
        {gameOver && finalState && (
          <GameOverModal
            state={finalState}
            elapsedTime={finalElapsedTime}
            onRestart={handleRestart}
            submitting={submitting}
            submitResult={submitResult ?? null}
            isSignedIn={isSignedIn}
          />
        )}
      </div>
    </main>
  );
}
