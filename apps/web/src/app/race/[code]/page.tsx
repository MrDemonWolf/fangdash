"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { GameState, RacePlayer, RaceResult } from "@fangdash/shared";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RaceConnection } from "@/lib/party";
import { RaceResultModal } from "@/components/game/RaceResultModal";
import { CountdownOverlay } from "@/components/game/CountdownOverlay";

// ---------------------------------------------------------------------------
// Inline GameHUD (matches the play page)
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
// Phase type
// ---------------------------------------------------------------------------
type Phase = "waiting" | "countdown" | "racing" | "results";

// ---------------------------------------------------------------------------
// Active Race Room Page
// ---------------------------------------------------------------------------
export default function RaceRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code.toUpperCase();

  // Auth
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

  // tRPC
  const trpc = useTRPC();
  const { data: skinData } = useQuery(
    trpc.skin.getEquippedSkin.queryOptions(undefined, {
      enabled: isSignedIn,
    })
  );
  const { mutate: submitResult } = useMutation(
    trpc.race.submitResult.mutationOptions({
      onError: (err) => {
        console.error("Failed to submit race result:", err);
      },
    })
  );

  // State
  const [phase, setPhase] = useState<Phase>("waiting");
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [myId, setMyId] = useState<string>("");
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [raceSeed, setRaceSeed] = useState("");
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);

  // Game state for HUD
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    distance: 0,
    obstaclesCleared: 0,
    alive: true,
    speed: 0,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null);
  const connectionRef = useRef<RaceConnection | null>(null);

  const equippedSkin = skinData?.skinId ?? "default";

  // ── Timer helpers ──
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

  // ── Game over handler ──
  const handleGameOver = useCallback(
    (state: GameState) => {
      stopTimer();
      // The race_end message from the server will trigger the results phase
      // For now just update state
      setGameState(state);
    },
    [stopTimer]
  );

  // ── Start the Phaser race game ──
  const startRaceGame = useCallback(
    async (seed: string) => {
      if (!containerRef.current) return;

      const { createRaceGame, destroyGame } = await import("@fangdash/game");

      // Clean up previous game
      if (gameRef.current) {
        destroyGame(gameRef.current);
        gameRef.current = null;
      }

      // Reset game state
      setGameState({
        score: 0,
        distance: 0,
        obstaclesCleared: 0,
        alive: true,
        speed: 0,
      });

      const connection = connectionRef.current;

      const game = createRaceGame({
        parent: containerRef.current,
        skinKey: equippedSkin,
        seed,
        opponents: players
          .filter((p) => p.id !== myId)
          .map((p) => ({ id: p.id, username: p.username, skinId: p.skinId })),
        onStateUpdate: (state) => setGameState(state),
        onGameOver: handleGameOver,
        onPositionUpdate: (distance, score) => {
          connection?.sendUpdate(distance, score);
        },
        onPlayerDied: () => {
          connection?.sendDied();
        },
      });

      gameRef.current = game;
      startTimer();
    },
    [equippedSkin, players, myId, handleGameOver, startTimer]
  );

  // ── Connect to PartyKit ──
  useEffect(() => {
    if (!isSignedIn || !session?.user) return;

    const connection = new RaceConnection({ roomCode });
    connectionRef.current = connection;

    // Join with username and skin
    const username = session.user.name || session.user.email || "Player";
    connection.join(username, equippedSkin);

    // Listen for room state (initial snapshot)
    connection.on("room_state", (room) => {
      setPlayers(room.players);
      // Try to find our own id from the players list
      const me = room.players.find(
        (p) => p.username === username
      );
      if (me) setMyId(me.id);
    });

    connection.on("player_joined", (player) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === player.id)) return prev;
        return [...prev, player];
      });
    });

    connection.on("player_left", ({ id }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    });

    connection.on("countdown", ({ seconds }) => {
      setPhase("countdown");
      setCountdownSeconds(seconds);
    });

    connection.on("race_start", ({ seed }) => {
      setPhase("racing");
      setRaceSeed(seed);
    });

    connection.on("player_update", ({ id, distance, score }) => {
      // Forward to Phaser game
      if (gameRef.current) {
        const raceScene = gameRef.current.scene.getScene("RaceScene");
        if (raceScene?.receiveOpponentUpdate) {
          raceScene.receiveOpponentUpdate(id, distance, score);
        }
      }
      // Update players state
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, distance, score } : p))
      );
    });

    connection.on("player_died", ({ id }) => {
      if (gameRef.current) {
        const raceScene = gameRef.current.scene.getScene("RaceScene");
        if (raceScene?.receiveOpponentDied) {
          raceScene.receiveOpponentDied(id);
        }
      }
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, alive: false } : p))
      );
    });

    connection.on("race_end", ({ results }) => {
      setPhase("results");
      setRaceResults(results);
    });

    return () => {
      connection.disconnect();
      connectionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, roomCode]);

  // ── Start game when phase transitions to racing ──
  useEffect(() => {
    if (phase === "racing" && raceSeed) {
      startRaceGame(raceSeed);
    }
  }, [phase, raceSeed, startRaceGame]);

  // ── Submit result when race ends ──
  useEffect(() => {
    if (phase !== "results" || raceResults.length === 0) return;

    // Destroy game
    if (gameRef.current) {
      import("@fangdash/game").then(({ destroyGame }) => {
        if (gameRef.current) {
          destroyGame(gameRef.current);
          gameRef.current = null;
        }
      });
    }
    stopTimer();

    // Submit our result
    const myResult = raceResults.find((r) => r.playerId === myId);
    if (myResult && isSignedIn) {
      submitResult({
        raceId: myResult.raceId,
        placement: myResult.placement,
        score: myResult.score,
        distance: myResult.distance,
        seed: raceSeed,
      });
    }
  }, [phase, raceResults, myId, isSignedIn, submitResult, raceSeed, stopTimer]);

  // ── Cleanup on unmount ──
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

  // ── Handlers ──
  const handleReady = () => {
    connectionRef.current?.sendReady();
  };

  const handleRematch = () => {
    setPhase("waiting");
    setRaceResults([]);
    setRaceSeed("");
    setGameState({
      score: 0,
      distance: 0,
      obstaclesCleared: 0,
      alive: true,
      speed: 0,
    });
    setElapsedTime(0);
    connectionRef.current?.sendReady();
  };

  // ── Auth guard ──
  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#0FACED]/20 bg-[#091533]/95 p-8 text-center shadow-2xl">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white">
            Race Room
          </h1>
          <p className="mb-6 text-white/50">
            Sign in to join this race.
          </p>
          <Link
            href="/race"
            className="inline-block rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            Back to Lobby
          </Link>
        </div>
      </main>
    );
  }

  // ── Waiting Phase ──
  if (phase === "waiting") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Room code header */}
          <div className="text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-white/40">
              Room Code
            </p>
            <h1 className="mb-1 text-5xl font-black tracking-widest text-[#0FACED]">
              {roomCode}
            </h1>
            <p className="text-sm text-white/40">
              Share this code with friends to join
            </p>
          </div>

          {/* Player list */}
          <div className="rounded-xl border border-[#0FACED]/20 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Players ({players.length})
            </h2>
            <div className="space-y-2">
              {players.length === 0 && (
                <p className="text-sm text-white/30">Connecting...</p>
              )}
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0FACED]/20 text-xs font-bold text-[#0FACED]">
                    {player.skinId === "default" ? "D" : player.skinId.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-sm font-semibold text-white">
                    {player.username}
                  </span>
                  {player.id === myId && (
                    <span className="text-xs text-white/30">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ready button */}
          <button
            type="button"
            onClick={handleReady}
            className="w-full cursor-pointer rounded-lg bg-[#0FACED] px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
          >
            Ready
          </button>

          {/* Back to lobby */}
          <div className="text-center">
            <Link
              href="/race"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Back to Lobby
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Countdown / Racing / Results phases ──
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533]">
      <div className="relative w-full max-w-[800px]">
        {/* HUD overlay (visible during racing) */}
        {phase === "racing" && (
          <GameHUD
            score={gameState.score}
            distance={gameState.distance}
            elapsedTime={elapsedTime}
          />
        )}

        {/* Game canvas container */}
        <div
          ref={containerRef}
          className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#0FACED]/20"
        />

        {/* Countdown overlay */}
        {phase === "countdown" && (
          <CountdownOverlay seconds={countdownSeconds} />
        )}

        {/* Race results modal */}
        {phase === "results" && raceResults.length > 0 && (
          <RaceResultModal
            results={raceResults.map((r) => ({
              playerId: r.playerId,
              username:
                players.find((p) => p.id === r.playerId)?.username ??
                "Unknown",
              placement: r.placement,
              score: r.score,
              distance: r.distance,
            }))}
            onRematch={handleRematch}
          />
        )}
      </div>
    </main>
  );
}
