"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OnboardingOverlay from "@/components/game/OnboardingOverlay";
import DebugPanel from "@/components/game/DebugPanel";
import { GameHUD } from "@/components/game/GameHUD";
import { GameOverModal } from "@/components/game/GameOverModal";
import type { GameState, DebugState, DebugCommand } from "@fangdash/shared";
import type { DebugChannel, AudioChannel } from "@fangdash/game";
import { useSession } from "@/lib/auth-client";
import { useIsDevOrAdmin } from "@/lib/use-role";
import { useTRPC } from "@/lib/trpc";
import { getSkinById } from "@fangdash/shared/skins";
import { useMutation, useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Main Play Page
// ---------------------------------------------------------------------------
export default function PlayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null);
  const debugRef = useRef<DebugChannel | null>(null);
  const audioRef = useRef<AudioChannel | null>(null);
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
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);

  const { data: session } = useSession();
  const isSignedIn = !!session?.user;
  const isDevOrAdmin = useIsDevOrAdmin();

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
    error: submitError,
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

    const { game, debug, audio } = createGame({
      parent: containerRef.current,
      skinKey: skinData?.skinId ? getSkinById(skinData.skinId)?.spriteKey ?? "wolf-gray" : undefined,
      onStateUpdate: (state) => {
        setGameState(state);
      },
      onGameOver: handleGameOver,
      onDebugUpdate: (state: DebugState) => {
        setDebugState(state);
      },
    });

    gameRef.current = game;
    debugRef.current = debug;
    audioRef.current = audio;
    setAudioMuted(audio.getMuted());
    setAudioVolume(audio.getVolume());
    startTimer();
  }, [skinData?.skinId, handleGameOver, startTimer]);

  // Check onboarding status on mount
  useEffect(() => {
    const done = localStorage.getItem("fangdash_onboarding_complete");
    setShowOnboarding(done !== "true");
  }, []);

  const handleToggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const newMuted = !a.getMuted();
    a.setMuted(newMuted);
    setAudioMuted(newMuted);
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.setVolume(v);
    setAudioVolume(v);
    if (v > 0 && a.getMuted()) {
      a.setMuted(false);
      setAudioMuted(false);
    }
  }, []);

  const handleDebugCommand = useCallback((command: DebugCommand) => {
    debugRef.current?.sendCommand(command);
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
            muted={audioMuted}
            volume={audioVolume}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
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
            submitError={submitError}
            isSignedIn={isSignedIn}
          />
        )}

      </div>

      {/* Debug Panel (dev/admin only, Ctrl+Shift+D) */}
      {isDevOrAdmin && (
        <DebugPanel debugState={debugState} onSendCommand={handleDebugCommand} />
      )}
    </main>
  );
}
