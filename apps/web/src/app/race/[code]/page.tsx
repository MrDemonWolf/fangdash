"use client";

import type { DebugChannel } from "@fangdash/game";
import type { DebugCommand, DebugState, GameState, RacePlayer, RaceResult } from "@fangdash/shared";
import { getSkinById } from "@fangdash/shared/skins";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CountdownOverlay } from "@/components/game/CountdownOverlay.tsx";
import DebugPanel from "@/components/game/DebugPanel.tsx";
import { GameHUD } from "@/components/game/GameHUD.tsx";
import { RaceResultModal } from "@/components/game/RaceResultModal.tsx";
import { useSession } from "@/lib/auth-client.ts";
import { RaceConnection, type ConnectionState } from "@/lib/party.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { useIsAdmin } from "@/lib/use-role.ts";

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
	const isAdmin = useIsAdmin();

	// tRPC
	const trpc = useTRPC();
	const { data: skinData, isLoading: skinLoading } = useQuery(
		trpc.skin.getEquippedSkin.queryOptions(undefined, {
			enabled: isSignedIn,
		}),
	);
	const { mutate: submitResult } = useMutation(
		trpc.race.submitResult.mutationOptions({
			onError: (err) => {
				console.error("Failed to submit race result:", err);
				toast.error("Failed to submit race result.");
			},
		}),
	);

	// State
	const [readySent, setReadySent] = useState(false);
	const [phase, setPhase] = useState<Phase>("waiting");
	const [players, setPlayers] = useState<RacePlayer[]>([]);
	const [myId, setMyId] = useState<string>("");
	const [hostId, setHostId] = useState<string | null>(null);
	const [playerReadyMap, setPlayerReadyMap] = useState<Record<string, boolean>>({});
	const [kicked, setKicked] = useState(false);
	const [copied, setCopied] = useState(false);
	const [streamerMode, setStreamerMode] = useState(false);
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
		longestCleanRun: 0,
		cheatsUsed: false,
	});
	const [elapsedTime, setElapsedTime] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(0);

	// Connection state
	const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

	// Game error
	const [gameError, setGameError] = useState<string | null>(null);

	// Debug
	const [debugState, setDebugState] = useState<DebugState | null>(null);
	const debugRef = useRef<DebugChannel | null>(null);
	const [gameKey, _setGameKey] = useState(0);

	// Refs
	const containerRef = useRef<HTMLDivElement>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const gameRef = useRef<any>(null);
	const connectionRef = useRef<RaceConnection | null>(null);
	const hasJoinedRef = useRef(false);

	const equippedSkin = skinData?.skinId
		? (getSkinById(skinData.skinId)?.spriteKey ?? "wolf-gray")
		: "wolf-gray";

	const isHost = myId !== "" && myId === hostId;

	// Sync streamer mode from localStorage after hydration
	useEffect(() => {
		setStreamerMode(localStorage.getItem("fangdash:streamer-mode") === "true");
	}, []);

	// ── Streamer mode toggle ──
	const toggleStreamerMode = () => {
		setStreamerMode((prev) => {
			const next = !prev;
			localStorage.setItem("fangdash:streamer-mode", String(next));
			return next;
		});
	};

	// ── Copy room code ──
	const handleCopyCode = () => {
		navigator.clipboard.writeText(roomCode).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

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
			setGameState(state);
		},
		[stopTimer],
	);

	// ── Start the Phaser race game ──
	const startRaceGame = useCallback(
		async (seed: string) => {
			if (!containerRef.current) {
				return;
			}

			try {
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
					longestCleanRun: 0,
		cheatsUsed: false,
				});
				setGameError(null);

				const connection = connectionRef.current;

				const { game, debug } = createRaceGame({
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
					onError: (msg) => setGameError(msg),
					...(isAdmin && {
						onDebugUpdate: (state: DebugState) => {
							setDebugState(state);
						},
					}),
				});

				gameRef.current = game;
				debugRef.current = debug;
				startTimer();

				// Start the race once the scene is active
				const raceScene = game.scene.getScene("RaceScene");
				if (raceScene && "beginRace" in raceScene) {
					const start = () => (raceScene as { beginRace: () => void }).beginRace();
					if (raceScene.scene.isActive()) {
						start();
					} else {
						raceScene.events.once("create", start);
					}
				}
			} catch (err) {
				console.error("Failed to start race game:", err);
				setGameError("Failed to start game. Please reload and try again.");
			}
		},
		[equippedSkin, players, myId, handleGameOver, startTimer, isAdmin],
	);

	// ── Connect to PartyKit ──
	useEffect(() => {
		if (!(isSignedIn && session?.user)) {
			return;
		}

		hasJoinedRef.current = false;
		let wasDisconnected = false;
		const connection = new RaceConnection({
			roomCode,
			onConnectionStateChange: (state) => {
				setConnectionState(state);
				if (state === "disconnected" || state === "error") {
					wasDisconnected = true;
				}
				if (state === "connected" && wasDisconnected) {
					wasDisconnected = false;
					toast.success("Reconnected to race room.");
				}
			},
		});
		connectionRef.current = connection;

		connection.on("room_state", (room) => {
			setPlayers(room.players);
			setHostId(room.hostId);
			const readyMap: Record<string, boolean> = {};
			for (const p of room.players) {
				readyMap[p.id] = p.ready;
			}
			setPlayerReadyMap(readyMap);
			// Use socket id directly
			const socketId = connection.id;
			if (socketId) setMyId(socketId);
		});

		connection.on("player_joined", (player) => {
			setPlayers((prev) => {
				if (prev.some((p) => p.id === player.id)) return prev;
				return [...prev, player];
			});
			setPlayerReadyMap((prev) => ({ ...prev, [player.id]: player.ready }));
		});

		connection.on("player_left", ({ id }) => {
			setPlayers((prev) => prev.filter((p) => p.id !== id));
			setPlayerReadyMap((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
		});

		connection.on("host_changed", ({ hostId: newHostId }) => {
			setHostId(newHostId);
			setPlayers((prev) => prev.map((p) => ({ ...p, isHost: p.id === newHostId })));
		});

		connection.on("player_ready", ({ id, ready }) => {
			setPlayerReadyMap((prev) => ({ ...prev, [id]: ready }));
			setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ready } : p)));
		});

		connection.on("player_kicked", ({ id }) => {
			if (id === connection.id) {
				setKicked(true);
				connection.disconnect();
				connectionRef.current = null;
			} else {
				setPlayers((prev) => prev.filter((p) => p.id !== id));
				setPlayerReadyMap((prev) => {
					const next = { ...prev };
					delete next[id];
					return next;
				});
			}
		});

		connection.on("room_reset", (room) => {
			setPhase("waiting");
			setPlayers(room.players);
			setHostId(room.hostId);
			const readyMap: Record<string, boolean> = {};
			for (const p of room.players) {
				readyMap[p.id] = p.ready;
			}
			setPlayerReadyMap(readyMap);
			setReadySent(false);
			setRaceResults([]);
			setRaceSeed("");
			setGameState({
				score: 0,
				distance: 0,
				obstaclesCleared: 0,
				alive: true,
				speed: 0,
				longestCleanRun: 0,
		cheatsUsed: false,
			});
			setElapsedTime(0);
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
			if (gameRef.current) {
				const raceScene = gameRef.current.scene.getScene("RaceScene");
				if (raceScene?.receiveOpponentUpdate) {
					raceScene.receiveOpponentUpdate(id, distance, score);
				}
			}
			setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, distance, score } : p)));
		});

		connection.on("player_died", ({ id }) => {
			if (gameRef.current) {
				const raceScene = gameRef.current.scene.getScene("RaceScene");
				if (raceScene?.receiveOpponentDied) {
					raceScene.receiveOpponentDied(id);
				}
			}
			setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, alive: false } : p)));
		});

		connection.on("race_end", ({ results }) => {
			setPhase("results");
			setRaceResults(results);
		});

		return () => {
			connection.disconnect();
			connectionRef.current = null;
		};
	}, [isSignedIn, roomCode, session?.user?.email, session?.user?.name, session?.user]);

	// ── Join once skin data has resolved ──
	useEffect(() => {
		if (!(isSignedIn && session?.user)) {
			return;
		}
		if (skinLoading) {
			return; // still loading (errors treated as loaded)
		}
		if (hasJoinedRef.current) {
			return; // already joined
		}
		const connection = connectionRef.current;
		if (!connection) {
			return;
		}
		hasJoinedRef.current = true;
		const username = session.user.name || session.user.email || "Player";
		connection.join(username, equippedSkin);
	}, [isSignedIn, session, equippedSkin, skinLoading, roomCode]);

	// ── Start game when phase transitions to racing ──
	useEffect(() => {
		if (phase === "racing" && raceSeed) {
			startRaceGame(raceSeed);
		}
	}, [phase, raceSeed, startRaceGame]);

	// ── Submit result when race ends ──
	useEffect(() => {
		if (phase !== "results" || raceResults.length === 0) {
			return;
		}

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

		// Submit our result (pass cheated flag so server skips rewards)
		const myResult = raceResults.find((r) => r.playerId === myId);
		if (myResult && isSignedIn) {
			submitResult({
				raceId: myResult.raceId,
				score: myResult.score,
				distance: myResult.distance,
				seed: raceSeed,
				cheated: gameState.cheatsUsed,
			});
		}
	}, [phase, raceResults, myId, isSignedIn, submitResult, raceSeed, stopTimer, gameState.cheatsUsed]);

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

	// ── Debug command handler ──
	const handleDebugCommand = useCallback((command: DebugCommand) => {
		debugRef.current?.sendCommand(command);
	}, []);

	// ── Handlers ──
	const handleReady = () => {
		connectionRef.current?.sendReady();
		setReadySent(true);
	};

	const handleRematch = () => {
		connectionRef.current?.sendRematch();
	};

	const handleKick = (playerId: string) => {
		connectionRef.current?.sendKick(playerId);
	};

	// ── Kicked screen ──
	if (kicked) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
				<div className="w-full max-w-md rounded-xl border border-red-500/20 bg-[#091533]/95 p-8 text-center shadow-2xl">
					<h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white">
						You were kicked
					</h1>
					<p className="mb-6 text-white/50">The host removed you from this race room.</p>
					<Link
						href="/race"
						className="inline-block rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
					>
						Back to Lobby
					</Link>
				</div>
			</main>
		);
	}

	// ── Auth guard ──
	if (!isSignedIn) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
				<div className="w-full max-w-md rounded-xl border border-[#0FACED]/20 bg-[#091533]/95 p-8 text-center shadow-2xl">
					<h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white">Race Room</h1>
					<p className="mb-6 text-white/50">Sign in to join this race.</p>
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
					{/* Streamer mode toggle */}
					<div className="flex justify-end">
						<button
							type="button"
							onClick={toggleStreamerMode}
							title={streamerMode ? "Disable streamer mode" : "Enable streamer mode"}
							className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
						>
							{streamerMode ? (
								// Eye-off icon
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							) : (
								// Eye icon
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>

					{/* Room code header */}
					<div className="text-center">
						<p className="mb-2 text-sm font-medium uppercase tracking-wider text-white/40">
							Room Code
						</p>
						<div className="flex items-center justify-center gap-3">
							<h1 className="text-5xl font-black tracking-widest text-[#0FACED]">
								{streamerMode ? "------" : roomCode}
							</h1>
							<button
								type="button"
								onClick={handleCopyCode}
								title="Copy room code"
								className="rounded-lg border border-[#0FACED]/30 px-3 py-2 text-xs font-semibold text-[#0FACED]/70 transition-colors hover:border-[#0FACED]/60 hover:text-[#0FACED]"
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<p className="mt-1 text-sm text-white/40">Share this code with friends to join</p>
					</div>

					{/* Player list */}
					<div className="rounded-xl border border-[#0FACED]/20 bg-white/5 p-6">
						<h2 className="mb-4 text-lg font-semibold text-white">Players ({players.length})</h2>
						<div className="space-y-2">
							{players.length === 0 && <p className="text-sm text-white/30">Connecting...</p>}
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
									{player.id === hostId && (
										<span className="rounded bg-[#0FACED]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#0FACED]">
											HOST
										</span>
									)}
									{playerReadyMap[player.id] && (
										<span className="text-sm text-green-400" title="Ready">
											✓
										</span>
									)}
									{player.id === myId && <span className="text-xs text-white/30">(you)</span>}
									{isHost && player.id !== myId && (
										<button
											type="button"
											onClick={() => handleKick(player.id)}
											title="Kick player"
											className="ml-1 rounded p-1 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
										>
											✕
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Ready / Start button */}
					<button
						type="button"
						onClick={handleReady}
						disabled={readySent}
						className={`w-full cursor-pointer rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
							readySent
								? "bg-[#0FACED]/40 text-[#091533]/60 cursor-not-allowed"
								: "bg-[#0FACED] text-[#091533] hover:bg-[#0FACED]/80"
						}`}
					>
						{isHost ? (readySent ? "Starting..." : "Start Race") : readySent ? "Ready ✓" : "Ready"}
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
					style={{ touchAction: "none" }}
				/>

				{/* Connection lost overlay */}
				{(connectionState === "disconnected" || connectionState === "error") &&
					phase === "racing" && (
						<div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-[#091533]/80">
							<div className="mx-4 w-full max-w-xs rounded-xl border border-yellow-500/30 bg-[#091533] p-6 text-center shadow-2xl">
								<div className="mb-3 text-3xl">⚡</div>
								<h2 className="mb-1 text-lg font-bold text-white">Connection Lost</h2>
								<p className="mb-4 text-sm text-white/50">Attempting to reconnect…</p>
								<button
									type="button"
									onClick={() => {
										connectionRef.current?.disconnect();
										router.push("/race");
									}}
									className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
								>
									Leave Race
								</button>
							</div>
						</div>
					)}

				{/* Game load error overlay */}
				{gameError && (
					<div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-[#091533]/90">
						<div className="mx-4 w-full max-w-xs rounded-xl border border-red-500/30 bg-[#091533] p-6 text-center shadow-2xl">
							<div className="mb-3 text-3xl">⚠</div>
							<h2 className="mb-1 text-lg font-bold text-white">Failed to load game</h2>
							<p className="mb-4 text-sm text-white/50">{gameError}</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="rounded-lg bg-[#0FACED] px-5 py-2 text-sm font-bold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
							>
								Reload Page
							</button>
						</div>
					</div>
				)}

				{/* Countdown overlay */}
				{phase === "countdown" && <CountdownOverlay seconds={countdownSeconds} />}

				{/* Race results modal */}
				{phase === "results" && raceResults.length > 0 && (
					<RaceResultModal
						results={raceResults.map((r) => ({
							playerId: r.playerId,
							username: players.find((p) => p.id === r.playerId)?.username ?? "Unknown",
							placement: r.placement,
							score: r.score,
							distance: r.distance,
						}))}
						onRematch={isHost ? handleRematch : undefined}
					/>
				)}

				{/* Debug Panel (dev/admin only, Ctrl+Shift+D) */}
				{isAdmin && (
					<DebugPanel
						debugState={debugState}
						onSendCommand={handleDebugCommand}
						gameKey={gameKey}
					/>
				)}
			</div>
		</main>
	);
}
