"use client";

import type { AudioChannel, DebugChannel, GameChannel } from "@fangdash/game";
import type { DebugCommand, DebugState, DifficultyName, GameState } from "@fangdash/shared";
import { getSkinById } from "@fangdash/shared/skins";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { CountdownOverlay } from "@/components/game/CountdownOverlay.tsx";
import DebugPanel from "@/components/game/DebugPanel.tsx";
import { GameHUD } from "@/components/game/GameHUD.tsx";
import { GameOverModal } from "@/components/game/GameOverModal.tsx";
import OnboardingOverlay from "@/components/game/OnboardingOverlay.tsx";
import { PlayMainMenu } from "@/components/game/PlayMainMenu.tsx";
import { PlayMenu } from "@/components/game/PlayMenu.tsx";
import { signInWithTwitch, signOut, useSession } from "@/lib/auth-client.ts";
import { addNotification } from "@/lib/notification-store.ts";
import { enqueue, processQueue, setupOnlineListener } from "@/lib/score-queue.ts";
import { addToHistory } from "@/lib/score-store.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { trpcVanilla } from "@/lib/trpc-provider.tsx";
import { useIsAdmin } from "@/lib/use-role.ts";

// ---------------------------------------------------------------------------
// Main Play Page
// ---------------------------------------------------------------------------
export default function PlayPage() {
	const containerRef = useRef<HTMLDivElement>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const gameRef = useRef<any>(null);
	const debugRef = useRef<DebugChannel | null>(null);
	const audioRef = useRef<AudioChannel | null>(null);
	const gameChannelRef = useRef<GameChannel | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const goTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const startTimeRef = useRef<number>(0);

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
	const [gameOver, setGameOver] = useState(false);
	const [finalState, setFinalState] = useState<GameState | null>(null);
	const [finalElapsedTime, setFinalElapsedTime] = useState(0);
	const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
	const [debugState, setDebugState] = useState<DebugState | null>(null);
	const [gameKey, setGameKey] = useState(0);
	const [audioMuted, setAudioMuted] = useState(false);
	const [audioVolume, setAudioVolume] = useState(0.5);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [showMenu, setShowMenu] = useState(true);
	const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
	const selectedDifficultyRef = useRef("easy");
	const [selectedMods, setSelectedMods] = useState(0);
	const selectedModsRef = useRef(0);
	const [gameError, setGameError] = useState<string | null>(null);

	function readHudBool(key: string): boolean {
		try {
			const v = localStorage.getItem(key);
			return v === null ? true : v !== "false";
		} catch {
			return true;
		}
	}
	const [hudShowScore, setHudShowScore] = useState(true);
	const [hudShowInput, setHudShowInput] = useState(true);
	const [hudShowLeaderboard, setHudShowLeaderboard] = useState(true);
	useEffect(() => {
		setHudShowScore(readHudBool("fangdash:hud-score"));
		setHudShowInput(readHudBool("fangdash:hud-input"));
		setHudShowLeaderboard(readHudBool("fangdash:hud-leaderboard"));
	}, [menuOpen]);

	// Keep refs in sync so countdown callback reads latest value
	selectedDifficultyRef.current = selectedDifficulty;
	selectedModsRef.current = selectedMods;

	const { data: session, isPending: sessionPending } = useSession();
	// Prevent hydration mismatch: useSession returns isPending=false on the server
	// but isPending=true on the client's first render. Force pending until mounted.
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => setHasMounted(true), []);
	const isPending = !hasMounted || sessionPending;
	const isSignedIn = !!session?.user;
	const isAdmin = useIsAdmin();

	// Fetch equipped skin (only when signed in)
	const trpc = useTRPC();
	const { data: skinData } = useQuery(
		trpc.skin.getEquippedSkin.queryOptions(undefined, {
			enabled: isSignedIn,
		}),
	);

	// Fetch best score (only when signed in)
	const { data: myScores } = useQuery(
		trpc.score.myScores.queryOptions(undefined, {
			enabled: isSignedIn,
		}),
	);
	const bestScore = myScores?.[0]?.score ?? 0;

	// Session salt for HMAC anti-tamper
	const sessionSaltRef = useRef(crypto.randomUUID());

	const equippedSkinKey = skinData?.skinId
		? (getSkinById(skinData.skinId)?.spriteKey ?? "wolf-gray")
		: "wolf-gray";

	const {
		mutate: submitScore,
		data: submitResult,
		isPending: submitting,
		error: submitError,
	} = useMutation(
		trpc.score.submit.mutationOptions({
			onSuccess: (result) => {
				if (result.newAchievements.length > 0) {
					for (const id of result.newAchievements) {
						addNotification({
							type: "achievement",
							title: "Achievement Unlocked!",
							description: id,
							href: "/achievements",
						});
					}
				}
				if (result.newSkins.length > 0) {
					for (const id of result.newSkins) {
						addNotification({
							type: "skin",
							title: "New Skin Unlocked!",
							description: id,
							href: "/skins",
						});
					}
				}
				if (result.levelUp) {
					addNotification({
						type: "level_up",
						title: "Level Up!",
						description: `You reached level ${result.newLevel}!`,
					});
				}
				addNotification({
					type: "score",
					title: "Score Submitted",
					description: `Score of ${result.xpGained.toLocaleString()} submitted successfully.`,
				});
			},
			onError: (err) => {
				console.error("Failed to submit score:", err);
			},
		}),
	);

	// Set up online listener for retrying queued scores
	useEffect(() => {
		const submitFn = (payload: Parameters<typeof trpcVanilla.score.submit.mutate>[0]) =>
			trpcVanilla.score.submit.mutate(payload);
		const cleanup = setupOnlineListener(submitFn);
		// Process any existing pending scores on mount
		processQueue(submitFn);
		return cleanup;
	}, []);

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

	const startCountdown = useCallback(() => {
		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
		}
		setCountdown(5);
		let remaining = 5;
		countdownTimerRef.current = setInterval(() => {
			remaining -= 1;
			setCountdown(remaining);
			if (remaining <= 0) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				clearInterval(countdownTimerRef.current!);
				countdownTimerRef.current = null;
				// Show "GO!" briefly then launch
				goTimeoutRef.current = setTimeout(() => {
					goTimeoutRef.current = null;
					gameChannelRef.current?.start(selectedDifficultyRef.current, selectedModsRef.current);
					startTimer();
					setCountdown(null);
				}, 700);
			}
		}, 1000);
	}, [startTimer]);

	const handleGameOver = useCallback(
		(state: GameState) => {
			stopTimer();
			const duration = Date.now() - startTimeRef.current;
			setFinalState(state);
			setFinalElapsedTime(duration);
			setGameOver(true);

			const payload = {
				score: state.score,
				distance: state.distance,
				obstaclesCleared: state.obstaclesCleared,
				longestCleanRun: state.longestCleanRun,
				duration,
				seed: Date.now().toString(),
				difficulty: selectedDifficultyRef.current as DifficultyName,
				mods: selectedModsRef.current,
			};

			// Always store in local history
			addToHistory({
				type: "solo",
				score: state.score,
				distance: state.distance,
				duration,
				difficulty: selectedDifficultyRef.current,
				mods: selectedModsRef.current,
				cheated: state.cheatsUsed,
			});

			if (isSignedIn && !state.cheatsUsed) {
				// Submit directly via mutation for immediate UI feedback
				submitScore(payload);
				// Also enqueue for retry in case the mutation fails silently
				enqueue("solo", payload, sessionSaltRef.current);
			} else if (!state.cheatsUsed) {
				// Not signed in — enqueue for later sync on login
				enqueue("solo", payload, sessionSaltRef.current);
			}
		},
		[isSignedIn, stopTimer, submitScore],
	);

	const startGame = useCallback(async () => {
		if (!containerRef.current) {
			return;
		}
		setGameKey((k) => k + 1);
		setDebugState(null);

		try {
			// Dynamically import Phaser game (not available during SSR)
			const { createGame, destroyGame } = await import("@fangdash/game");

			// Cancel any pending countdown timers before destroying the game
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
				countdownTimerRef.current = null;
			}
			if (goTimeoutRef.current) {
				clearTimeout(goTimeoutRef.current);
				goTimeoutRef.current = null;
			}
			setCountdown(null);

			// Clean up previous game
			if (gameRef.current) {
				destroyGame(gameRef.current);
				gameRef.current = null;
			}

			// Reset state
			setGameOver(false);
			setFinalState(null);
			setFinalElapsedTime(0);
			setGameError(null);
			setGameState({
				score: 0,
				distance: 0,
				obstaclesCleared: 0,
				alive: true,
				speed: 0,
				longestCleanRun: 0,
				cheatsUsed: false,
			});

			const { game, debug, audio, gameChannel } = createGame({
				parent: containerRef.current,
				skinKey: equippedSkinKey,
				startDifficulty: selectedDifficulty,
				mods: selectedMods,
				onStateUpdate: (state) => {
					setGameState(state);
				},
				onGameOver: handleGameOver,
				onDebugUpdate: (state: DebugState) => {
					setDebugState(state);
				},
				onError: (msg) => setGameError(msg),
			});

			gameRef.current = game;
			debugRef.current = debug;
			audioRef.current = audio;
			gameChannelRef.current = gameChannel;
			setAudioMuted(audio.getMuted());
			setAudioVolume(audio.getVolume());
			// Start in preview mode (background scrolls, no gameplay)
			gameChannel.preview();
		} catch (err) {
			console.error("Failed to start game:", err);
			setGameError("Failed to start game. Please reload and try again.");
			gameRef.current = null;
			debugRef.current = null;
			audioRef.current = null;
			gameChannelRef.current = null;
		}
	}, [equippedSkinKey, selectedDifficulty, selectedMods, handleGameOver]);

	// Check onboarding status on mount
	useEffect(() => {
		const done = localStorage.getItem("fangdash_onboarding_complete");
		setShowOnboarding(done !== "true");
	}, []);

	const handleToggleMute = useCallback(() => {
		const a = audioRef.current;
		if (!a) {
			return;
		}
		const newMuted = !a.getMuted();
		a.setMuted(newMuted);
		setAudioMuted(newMuted);
	}, []);

	const handleVolumeChange = useCallback((v: number) => {
		const a = audioRef.current;
		if (!a) {
			return;
		}
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

	const openMenu = useCallback(() => {
		gameChannelRef.current?.pause();
		setMenuOpen(true);
	}, []);

	const closeMenu = useCallback(() => {
		setMenuOpen(false);
		gameChannelRef.current?.resume();
	}, []);

	const handleOnboardingComplete = useCallback(() => {
		localStorage.setItem("fangdash_onboarding_complete", "true");
		setShowOnboarding(false);
	}, []);

	// Start game on mount (wait for skin data if signed in, wait for onboarding)
	const hasInitialized = useRef(false);
	useEffect(() => {
		if (hasInitialized.current) {
			return;
		}
		// Wait for onboarding check to complete
		if (showOnboarding === null) {
			return;
		}
		// Don't start if onboarding is showing
		if (showOnboarding) {
			return;
		}
		// If signed in, wait for skin data before starting
		if (isSignedIn && !skinData) {
			return;
		}

		hasInitialized.current = true;
		startGame();
	}, [isSignedIn, skinData, startGame, showOnboarding]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
			}
			if (goTimeoutRef.current) {
				clearTimeout(goTimeoutRef.current);
			}
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

	const handleRetrySubmit = useCallback(() => {
		if (!finalState || finalState.cheatsUsed) {
			return;
		}
		const payload = {
			score: finalState.score,
			distance: finalState.distance,
			obstaclesCleared: finalState.obstaclesCleared,
			longestCleanRun: finalState.longestCleanRun,
			duration: finalElapsedTime,
			seed: Date.now().toString(),
			difficulty: selectedDifficultyRef.current as DifficultyName,
			mods: selectedModsRef.current,
		};
		submitScore(payload);
		enqueue("solo", payload, sessionSaltRef.current);
	}, [finalState, finalElapsedTime, submitScore]);

	// Escape key toggles menu (only when game is running, not during countdown or game over)
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") {
				return;
			}
			if (gameOver || countdown !== null || showMenu) {
				return;
			}
			if (menuOpen) {
				closeMenu();
			} else {
				openMenu();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [gameOver, countdown, menuOpen, showMenu, openMenu, closeMenu]);

	const handleSignIn = useCallback(() => {
		signInWithTwitch({ preservePath: true });
	}, []);

	const handleSignOut = useCallback(() => {
		signOut();
	}, []);

	const handleStartPlay = useCallback(() => {
		setShowMenu(false);
		startCountdown();
	}, [startCountdown]);

	const handleRestart = useCallback(() => {
		setShowMenu(true);
		hasInitialized.current = false;
		startGame();
		hasInitialized.current = true;
	}, [startGame]);

	return (
		<main className="flex flex-col h-dvh overflow-hidden bg-[#091533]">
			<div className="relative w-full h-dvh">
				{/* HUD overlay */}
				{!(gameOver || showMenu) && (
					<GameHUD
						score={gameState.score}
						distance={gameState.distance}
						elapsedTime={elapsedTime}
						muted={audioMuted}
						onToggleMute={handleToggleMute}
						onOpenMenu={countdown === null ? openMenu : undefined}
						mods={selectedMods}
						difficulty={selectedDifficulty as DifficultyName}
						showScore={hudShowScore}
						showInputOverlay={hudShowInput}
						showLeaderboard={hudShowLeaderboard}
					/>
				)}

				{/* Game canvas container */}
				<div ref={containerRef} className="w-full h-full overflow-hidden bg-[#0f0f1a] touch-none" />

				{/* Game load error overlay */}
				{gameError && (
					<div className="absolute inset-0 flex items-center justify-center bg-[#091533]/90 z-50">
						<div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-[#091533] p-8 text-center shadow-2xl mx-4">
							<div className="mb-4 text-4xl">⚠</div>
							<h2 className="mb-2 text-xl font-bold text-white">Failed to load game</h2>
							<p className="mb-6 text-sm text-white/50">{gameError}</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
							>
								Reload Page
							</button>
						</div>
					</div>
				)}

				{/* Countdown overlay */}
				{countdown !== null && <CountdownOverlay seconds={countdown} />}

				{/* Main menu overlay */}
				{showMenu && (
					<PlayMainMenu
						onPlay={handleStartPlay}
						skinKey={equippedSkinKey}
						isSignedIn={isSignedIn}
						bestScore={bestScore}
						selectedDifficulty={selectedDifficulty}
						onSelectDifficulty={setSelectedDifficulty}
						selectedMods={selectedMods}
						onSelectMods={setSelectedMods}
						userName={session?.user?.name ?? undefined}
						userImage={session?.user?.image ?? undefined}
						isPending={isPending}
						onSignIn={handleSignIn}
						onSignOut={handleSignOut}
					/>
				)}

				{/* Play menu overlay */}
				{menuOpen && !gameOver && (
					<PlayMenu
						onClose={closeMenu}
						muted={audioMuted}
						volume={audioVolume}
						onToggleMute={handleToggleMute}
						onVolumeChange={handleVolumeChange}
						isSignedIn={isSignedIn}
					/>
				)}

				{/* Onboarding overlay */}
				{showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}

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
						cheatsUsed={finalState.cheatsUsed}
						onRetrySubmit={isSignedIn ? handleRetrySubmit : undefined}
					/>
				)}
			</div>

			{/* Debug Panel (dev/admin only, Ctrl+Shift+D) */}
			{isAdmin && (
				<DebugPanel debugState={debugState} onSendCommand={handleDebugCommand} gameKey={gameKey} />
			)}
		</main>
	);
}
