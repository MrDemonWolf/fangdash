"use client";

import type { DebugCommand, DebugState } from "@fangdash/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";

// ---------------------------------------------------------------------------
// localStorage persistence helpers
// ---------------------------------------------------------------------------
const DEBUG_FLAGS_KEY = "fangdash:debug:flags";

interface StoredDebugFlags {
	hitboxes: boolean;
	renderBoxes: boolean;
	invincible: boolean;
	difficulty: number;
	speedMultiplier: number;
}

const DEFAULT_DEBUG_FLAGS: StoredDebugFlags = {
	hitboxes: false,
	renderBoxes: false,
	invincible: false,
	difficulty: 0,
	speedMultiplier: 1.0,
};

function loadDebugFlags(): StoredDebugFlags {
	try {
		const raw = localStorage.getItem(DEBUG_FLAGS_KEY);
		if (!raw) {
			return { ...DEFAULT_DEBUG_FLAGS };
		}
		return { ...DEFAULT_DEBUG_FLAGS, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULT_DEBUG_FLAGS };
	}
}

function saveDebugFlags(flags: StoredDebugFlags) {
	localStorage.setItem(DEBUG_FLAGS_KEY, JSON.stringify(flags));
}

import {
	BASE_SPEED,
	DISTANCE_MULTIPLIER,
	DOUBLE_JUMP_VELOCITY,
	GRAVITY,
	JUMP_VELOCITY,
	MAX_JUMPS,
	MAX_OBSTACLE_GAP_MS,
	MAX_SPEED,
	MIN_OBSTACLE_GAP_MS,
	SCORE_PER_OBSTACLE,
	SCORE_PER_SECOND,
	SPEED_INCREASE_INTERVAL_MS,
	SPEED_INCREMENT,
} from "@fangdash/shared";
import { useIsAdmin } from "@/lib/use-role.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = "STATS" | "CONSTANTS" | "CHEATS";

interface DebugPanelProps {
	debugState: DebugState | null;
	onSendCommand: (command: DebugCommand) => void;
	gameKey: number;
}

// ---------------------------------------------------------------------------
// CRT CSS (injected once)
// ---------------------------------------------------------------------------
const CRT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.debug-crt {
  font-family: 'Press Start 2P', 'Courier New', monospace;
  background: #0f0f1a;
  color: #0FACED;
  border: 2px solid #0FACED;
  border-radius: 8px;
  box-shadow:
    0 0 10px rgba(15, 172, 237, 0.3),
    0 0 20px rgba(15, 172, 237, 0.1),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.debug-crt::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  z-index: 10;
}

.debug-crt::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
  z-index: 11;
}

.debug-crt-title {
  background: #1a1a2e;
  border-bottom: 1px solid #0FACED;
  cursor: grab;
  user-select: none;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.debug-crt-title:active {
  cursor: grabbing;
}

.debug-tab {
  background: transparent;
  color: #0FACED;
  border: 1px solid #0FACED;
  padding: 3px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.15s;
}

.debug-tab:hover {
  background: rgba(15, 172, 237, 0.15);
  text-shadow: 0 0 6px #0FACED;
}

.debug-tab-active {
  background: #0FACED;
  color: #0f0f1a;
  text-shadow: none;
}

.debug-label {
  color: #888;
  font-size: 7px;
  line-height: 1.6;
}

.debug-value {
  color: #0FACED;
  font-size: 7px;
  text-shadow: 0 0 4px rgba(15, 172, 237, 0.5);
}

.debug-value-warn {
  color: #ffaa00;
  text-shadow: 0 0 4px rgba(255, 170, 0, 0.5);
}

.debug-value-danger {
  color: #ff3333;
  text-shadow: 0 0 4px rgba(255, 51, 51, 0.5);
}

.debug-section-header {
  color: #0FACED;
  font-size: 8px;
  border-bottom: 1px dashed #0FACED;
  padding-bottom: 2px;
  margin-bottom: 4px;
  margin-top: 6px;
  text-shadow: 0 0 4px rgba(15, 172, 237, 0.5);
}

.debug-btn {
  background: #1a1a2e;
  color: #0FACED;
  border: 1px solid #0FACED;
  padding: 4px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
}

.debug-btn:hover {
  background: #ff6b2b;
  color: #0f0f1a;
  border-color: #ff6b2b;
  box-shadow: 0 0 8px rgba(255, 107, 43, 0.4);
}

.debug-btn-danger {
  border-color: #ff3333;
  color: #ff3333;
}

.debug-btn-danger:hover {
  background: #ff3333;
  color: #0f0f1a;
  border-color: #ff3333;
  box-shadow: 0 0 8px rgba(255, 51, 51, 0.4);
}

.debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 7px;
}

.debug-toggle-box {
  width: 14px;
  height: 14px;
  border: 1px solid #0FACED;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  flex-shrink: 0;
}

.debug-toggle-box-on {
  background: #ff6b2b;
  color: #0f0f1a;
  border-color: #ff6b2b;
  box-shadow: 0 0 6px rgba(255, 107, 43, 0.5);
}

.debug-slider-container {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 7px;
}

.debug-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: #1a1a2e;
  border: 1px solid #0FACED;
  outline: none;
}

.debug-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 14px;
  background: #0FACED;
  cursor: pointer;
  border: none;
}

.debug-slider::-moz-range-thumb {
  width: 10px;
  height: 14px;
  background: #0FACED;
  cursor: pointer;
  border: none;
}

.debug-select {
  background: #1a1a2e;
  color: #0FACED;
  border: 1px solid #0FACED;
  padding: 3px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  outline: none;
}

.debug-select option {
  background: #0f0f1a;
  color: #0FACED;
}

@keyframes debug-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.97; }
  75% { opacity: 0.99; }
}

.debug-crt-body {
  animation: debug-flicker 4s infinite;
  position: relative;
  z-index: 1;
}

.debug-minimize-btn {
  background: none;
  border: 1px solid #0FACED;
  color: #0FACED;
  width: 16px;
  height: 16px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.debug-minimize-btn:hover {
  background: #0FACED;
  color: #0f0f1a;
}

.debug-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  cursor: pointer;
  border-bottom: 1px solid rgba(15, 172, 237, 0.1);
}
.debug-toggle-row:hover { background: rgba(15, 172, 237, 0.05); }

.debug-pill { font-size: 6px; padding: 2px 6px; border: 1px solid currentColor; }
.debug-pill-on  { background: #ff6b2b; color: #0f0f1a; border-color: #ff6b2b; box-shadow: 0 0 6px rgba(255,107,43,.5); }
.debug-pill-off { color: #444; border-color: #333; }

.debug-slider-labels { display: flex; justify-content: space-between; font-size: 6px; color: #444; margin-top: 2px; }
`;

// ---------------------------------------------------------------------------
// Stat Row component
// ---------------------------------------------------------------------------
function StatRow({
	label,
	value,
	warn,
	danger,
}: {
	label: string;
	value: string | number;
	warn?: boolean;
	danger?: boolean;
}) {
	const cls = danger ? "debug-value-danger" : warn ? "debug-value-warn" : "debug-value";
	return (
		<div className="flex justify-between items-baseline gap-2">
			<span className="debug-label">{label}</span>
			<span className={cls}>{value}</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stats Tab
// ---------------------------------------------------------------------------
function StatsTab({ state }: { state: DebugState | null }) {
	if (!state) {
		return <div className="debug-label p-2">Waiting for game data...</div>;
	}

	return (
		<div className="space-y-1 p-2">
			<div className="debug-section-header">{"// PERFORMANCE"}</div>
			<StatRow label="FPS" value={state.fps} warn={state.fps < 30} danger={state.fps < 15} />
			<StatRow label="DELTA" value={`${state.frameDelta}ms`} />

			<div className="debug-section-header">{"// PLAYER"}</div>
			<StatRow label="POS" value={`${state.player.x}, ${state.player.y}`} />
			<StatRow label="VEL-Y" value={state.player.velocityY} />
			<StatRow label="JUMPS" value={`${state.player.jumpsRemaining}`} />
			<StatRow label="GROUND" value={state.player.grounded ? "YES" : "NO"} />
			<StatRow
				label="ALIVE"
				value={state.player.alive ? "YES" : "NO"}
				danger={!state.player.alive}
			/>
			<StatRow
				label="BOUNDS"
				value={`${state.player.bounds.width}x${state.player.bounds.height}`}
			/>

			<div className="debug-section-header">{"// SCORING"}</div>
			<StatRow label="SCORE" value={state.scoring.score} />
			<StatRow label="DIST" value={`${state.scoring.distance}m`} />
			<StatRow label="CLEARED" value={state.scoring.obstaclesCleared} />
			<StatRow label="SPEED" value={state.scoring.currentSpeed} />
			<StatRow label="TIME" value={`${Math.floor(state.scoring.elapsedMs / 1000)}s`} />

			<div className="debug-section-header">{"// DIFFICULTY"}</div>
			<StatRow label="LEVEL" value={state.difficulty.levelName.toUpperCase()} />
			<StatRow label="SPD-X" value={`${state.difficulty.speedMultiplier}x`} />
			<StatRow label="SPN-X" value={`${state.difficulty.spawnRateMultiplier}x`} />
			<StatRow label="GAP" value={`${state.difficulty.minGap}-${state.difficulty.maxGap}ms`} />

			<div className="debug-section-header">{"// SPAWNER"}</div>
			<StatRow label="SINCE" value={`${state.spawner.timeSinceLastSpawn}ms`} />
			<StatRow label="NEXT" value={`${state.spawner.nextSpawnTime}ms`} />
			<StatRow label="ACTIVE" value={state.spawner.activeObstacleCount} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Constants Tab
// ---------------------------------------------------------------------------
interface ConstantDef {
	key: string;
	label: string;
	defaultValue: number;
	min: number;
	max: number;
	step: number;
}

const CONSTANT_GROUPS: { name: string; constants: ConstantDef[] }[] = [
	{
		name: "PHYSICS",
		constants: [
			{
				key: "GRAVITY",
				label: "GRAVITY",
				defaultValue: GRAVITY,
				min: 100,
				max: 3000,
				step: 50,
			},
			{
				key: "JUMP_VELOCITY",
				label: "JUMP-V",
				defaultValue: JUMP_VELOCITY,
				min: -1000,
				max: -100,
				step: 10,
			},
			{
				key: "DOUBLE_JUMP_VELOCITY",
				label: "DJUMP-V",
				defaultValue: DOUBLE_JUMP_VELOCITY,
				min: -1000,
				max: -100,
				step: 10,
			},
			{
				key: "MAX_JUMPS",
				label: "MAX-JMP",
				defaultValue: MAX_JUMPS,
				min: 1,
				max: 10,
				step: 1,
			},
		],
	},
	{
		name: "SPEED",
		constants: [
			{
				key: "BASE_SPEED",
				label: "BASE-SPD",
				defaultValue: BASE_SPEED,
				min: 50,
				max: 800,
				step: 10,
			},
			{
				key: "MAX_SPEED",
				label: "MAX-SPD",
				defaultValue: MAX_SPEED,
				min: 200,
				max: 2000,
				step: 50,
			},
			{
				key: "SPEED_INCREMENT",
				label: "SPD-INC",
				defaultValue: SPEED_INCREMENT,
				min: 0.1,
				max: 5,
				step: 0.1,
			},
			{
				key: "SPEED_INCREASE_INTERVAL_MS",
				label: "SPD-INT",
				defaultValue: SPEED_INCREASE_INTERVAL_MS,
				min: 100,
				max: 5000,
				step: 100,
			},
		],
	},
	{
		name: "SCORING",
		constants: [
			{
				key: "SCORE_PER_SECOND",
				label: "SC/SEC",
				defaultValue: SCORE_PER_SECOND,
				min: 1,
				max: 100,
				step: 1,
			},
			{
				key: "SCORE_PER_OBSTACLE",
				label: "SC/OBS",
				defaultValue: SCORE_PER_OBSTACLE,
				min: 10,
				max: 500,
				step: 10,
			},
			{
				key: "DISTANCE_MULTIPLIER",
				label: "DIST-X",
				defaultValue: DISTANCE_MULTIPLIER,
				min: 0.01,
				max: 1,
				step: 0.01,
			},
		],
	},
	{
		name: "OBSTACLES",
		constants: [
			{
				key: "MIN_OBSTACLE_GAP_MS",
				label: "MIN-GAP",
				defaultValue: MIN_OBSTACLE_GAP_MS,
				min: 200,
				max: 3000,
				step: 50,
			},
			{
				key: "MAX_OBSTACLE_GAP_MS",
				label: "MAX-GAP",
				defaultValue: MAX_OBSTACLE_GAP_MS,
				min: 500,
				max: 5000,
				step: 100,
			},
		],
	},
];

function ConstantsTab({ onSendCommand }: { onSendCommand: (cmd: DebugCommand) => void }) {
	const [values, setValues] = useState<Record<string, number>>(() => {
		const initial: Record<string, number> = {};
		for (const group of CONSTANT_GROUPS) {
			for (const c of group.constants) {
				initial[c.key] = c.defaultValue;
			}
		}
		return initial;
	});

	const handleChange = (key: string, value: number) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		onSendCommand({ type: "set-constant", payload: { key, value } });
	};

	const handleReset = () => {
		const defaults: Record<string, number> = {};
		for (const group of CONSTANT_GROUPS) {
			for (const c of group.constants) {
				defaults[c.key] = c.defaultValue;
			}
		}
		setValues(defaults);
		onSendCommand({ type: "reset-constants" });
	};

	return (
		<div className="space-y-1 p-2">
			{CONSTANT_GROUPS.map((group) => (
				<div key={group.name}>
					<div className="debug-section-header">{`// ${group.name}`}</div>
					{group.constants.map((c) => (
						<div key={c.key} className="mb-2">
							<div className="flex justify-between items-baseline mb-1">
								<span className="debug-label">{c.label}</span>
								<span className="debug-value">{values[c.key]}</span>
							</div>
							<div className="debug-slider-container">
								<input
									type="range"
									className="debug-slider"
									min={c.min}
									max={c.max}
									step={c.step}
									value={values[c.key]}
									onChange={(e) => handleChange(c.key, Number.parseFloat(e.target.value))}
								/>
							</div>
						</div>
					))}
				</div>
			))}
			<div className="pt-2">
				<button type="button" className="debug-btn-danger debug-btn w-full" onClick={handleReset}>
					RESET DEFAULTS
				</button>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Cheats Tab
// ---------------------------------------------------------------------------
const DIFFICULTY_NAMES = ["EASY", "MEDIUM", "HARD", "INSANE", "NIGHTMARE"] as const;

function CheatsTab({
	debugState,
	onSendCommand,
	gameKey,
}: {
	debugState: DebugState | null;
	onSendCommand: (cmd: DebugCommand) => void;
	gameKey: number;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [skinUnlockStatus, setSkinUnlockStatus] = useState<string | null>(null);
	const unlockAllSkins = useMutation(
		trpc.admin.unlockAllSkins.mutationOptions({
			onSuccess: (data) => {
				setSkinUnlockStatus(`Unlocked ${data.unlockedCount} skins!`);
				queryClient.invalidateQueries({ queryKey: trpc.skin.gallery.queryOptions().queryKey });
				queryClient.invalidateQueries({ queryKey: trpc.skin.getUnlockedSkins.queryOptions().queryKey });
			},
			onError: (err) => {
				setSkinUnlockStatus(`Error: ${err.message}`);
			},
		}),
	);

	const [localFlags, setLocalFlags] = useState<StoredDebugFlags>(loadDebugFlags);
	const [difficulty, setDifficulty] = useState(() => loadDebugFlags().difficulty);
	const prevGameKeyRef = useRef(-1);

	// Prefer live game state when available, else fall back to localStorage
	const hitboxes = debugState?.debug?.hitboxes ?? localFlags.hitboxes;
	const renderBoxes = debugState?.debug?.renderBoxes ?? localFlags.renderBoxes;
	const invincible = debugState?.debug?.invincible ?? localFlags.invincible;
	const speedMultiplier = debugState?.debug?.speedMultiplier ?? localFlags.speedMultiplier;

	// Sync stored flags to game when a new game starts (gameKey increments from event handler,
	// debugState becomes non-null from Phaser's rAF loop — always separate React batch cycles)
	useEffect(() => {
		if (debugState !== null && gameKey !== prevGameKeyRef.current) {
			prevGameKeyRef.current = gameKey;
			const stored = loadDebugFlags();
			if (stored.hitboxes) {
				onSendCommand({ type: "toggle-hitboxes" });
			}
			if (stored.renderBoxes) {
				onSendCommand({ type: "toggle-render-boxes" });
			}
			if (stored.invincible) {
				onSendCommand({ type: "toggle-invincibility" });
			}
			if (stored.difficulty !== 0) {
				onSendCommand({ type: "set-difficulty", payload: stored.difficulty });
			}
			if (stored.speedMultiplier !== 1.0) {
				onSendCommand({
					type: "set-speed-multiplier",
					payload: stored.speedMultiplier,
				});
			}
		}
	}, [debugState, gameKey, onSendCommand]);

	const toggleHitboxes = () => {
		const updated = { ...localFlags, hitboxes: !hitboxes };
		setLocalFlags(updated);
		saveDebugFlags(updated);
		onSendCommand({ type: "toggle-hitboxes" });
	};

	const toggleRenderBoxes = () => {
		const updated = { ...localFlags, renderBoxes: !renderBoxes };
		setLocalFlags(updated);
		saveDebugFlags(updated);
		onSendCommand({ type: "toggle-render-boxes" });
	};

	const toggleInvincible = () => {
		const updated = { ...localFlags, invincible: !invincible };
		setLocalFlags(updated);
		saveDebugFlags(updated);
		onSendCommand({ type: "toggle-invincibility" });
	};

	const handleDifficultyChange = (idx: number) => {
		setDifficulty(idx);
		const updated = { ...localFlags, difficulty: idx };
		setLocalFlags(updated);
		saveDebugFlags(updated);
		onSendCommand({ type: "set-difficulty", payload: idx });
	};

	const handleSpeedMultiplierChange = (value: number) => {
		const updated = { ...localFlags, speedMultiplier: value };
		setLocalFlags(updated);
		saveDebugFlags(updated);
		onSendCommand({ type: "set-speed-multiplier", payload: value });
	};

	const handleReset = () => {
		setDifficulty(0);
		setLocalFlags({ ...DEFAULT_DEBUG_FLAGS });
		saveDebugFlags({ ...DEFAULT_DEBUG_FLAGS });
		if (hitboxes) {
			onSendCommand({ type: "toggle-hitboxes" });
		}
		if (renderBoxes) {
			onSendCommand({ type: "toggle-render-boxes" });
		}
		if (invincible) {
			onSendCommand({ type: "toggle-invincibility" });
		}
		if (difficulty !== 0) {
			onSendCommand({ type: "set-difficulty", payload: 0 });
		}
		if (speedMultiplier !== 1.0) {
			onSendCommand({ type: "set-speed-multiplier", payload: 1.0 });
		}
	};

	return (
		<div className="p-2">
			<div className="debug-section-header">{"// VISIBILITY"}</div>
			<div className="debug-toggle-row" onClick={toggleHitboxes}>
				<span className="debug-label">HITBOX VIZ</span>
				<span className={`debug-pill ${hitboxes ? "debug-pill-on" : "debug-pill-off"}`}>
					{hitboxes ? "ON" : "OFF"}
				</span>
			</div>
			<div className="debug-toggle-row" onClick={toggleRenderBoxes}>
				<span className="debug-label">RENDER VIZ</span>
				<span className={`debug-pill ${renderBoxes ? "debug-pill-on" : "debug-pill-off"}`}>
					{renderBoxes ? "ON" : "OFF"}
				</span>
			</div>

			<div className="debug-section-header">{"// INVINCIBILITY"}</div>
			<div className="debug-toggle-row" onClick={toggleInvincible}>
				<span className="debug-label">INVINCIBLE</span>
				<span className={`debug-pill ${invincible ? "debug-pill-on" : "debug-pill-off"}`}>
					{invincible ? "ON" : "OFF"}
				</span>
			</div>

			<div className="debug-section-header">{"// GAME OVERRIDES"}</div>
			<div className="mb-2">
				<div className="flex justify-between items-baseline mb-1">
					<span className="debug-label">DIFFICULTY</span>
					<span className="debug-value">{DIFFICULTY_NAMES[difficulty]}</span>
				</div>
				<select
					className="debug-select w-full"
					value={difficulty}
					onChange={(e) => handleDifficultyChange(Number.parseInt(e.target.value, 10))}
				>
					{DIFFICULTY_NAMES.map((name, idx) => (
						<option key={name} value={idx}>
							{name}
						</option>
					))}
				</select>
			</div>
			<div className="mb-2">
				<div className="flex justify-between items-baseline mb-1">
					<span className="debug-label">TIME SCALE</span>
					<span className="debug-value">{speedMultiplier.toFixed(1)}x</span>
				</div>
				<input
					type="range"
					className="debug-slider w-full"
					min={0.1}
					max={3.0}
					step={0.1}
					value={speedMultiplier}
					onChange={(e) => handleSpeedMultiplierChange(Number.parseFloat(e.target.value))}
				/>
				<div className="debug-slider-labels">
					<span>0.1x</span>
					<span>3.0x</span>
				</div>
			</div>

			<div className="debug-section-header">{"// ACTIONS"}</div>
			<button
				type="button"
				className="debug-btn-danger debug-btn w-full mb-2"
				onClick={() => onSendCommand({ type: "force-game-over" })}
			>
				FORCE GAME OVER
			</button>

			<div className="debug-section-header">{"// SKINS"}</div>
			<button
				type="button"
				className="debug-btn w-full mb-1"
				onClick={() => {
					setSkinUnlockStatus(null);
					unlockAllSkins.mutate();
				}}
				disabled={unlockAllSkins.isPending}
			>
				{unlockAllSkins.isPending ? "UNLOCKING..." : "UNLOCK ALL SKINS"}
			</button>
			{skinUnlockStatus && (
				<div className="debug-label mb-2" style={{ fontSize: "6px" }}>
					{skinUnlockStatus}
				</div>
			)}

			<div className="debug-section-header">{"// RESET"}</div>
			<button type="button" className="debug-btn debug-btn w-full" onClick={handleReset}>
				RESET CHEATS
			</button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main DebugPanel Component
// ---------------------------------------------------------------------------
export default function DebugPanel({ debugState, onSendCommand, gameKey }: DebugPanelProps) {
	const isAdmin = useIsAdmin();
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);
	const [minimized, setMinimized] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("STATS");
	const [position, setPosition] = useState({ x: 16, y: 80 });
	const dragging = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });
	const panelRef = useRef<HTMLDivElement>(null);
	const styleInjected = useRef(false);

	// Keyboard shortcut: Ctrl+Shift+D
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "D") {
				e.preventDefault();
				setVisible((v) => !v);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	// Inject CRT styles once
	useEffect(() => {
		if (styleInjected.current) {
			return;
		}
		styleInjected.current = true;
		const style = document.createElement("style");
		style.textContent = CRT_STYLES;
		style.setAttribute("data-debug-panel", "true");
		document.head.appendChild(style);
		return () => {
			style.remove();
			styleInjected.current = false;
		};
	}, []);

	// Dragging handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			dragging.current = true;
			dragOffset.current = {
				x: e.clientX - position.x,
				y: e.clientY - position.y,
			};
		},
		[position],
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!dragging.current) {
				return;
			}
			setPosition({
				x: e.clientX - dragOffset.current.x,
				y: e.clientY - dragOffset.current.y,
			});
		};
		const handleMouseUp = () => {
			dragging.current = false;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	if (!(mounted && isAdmin)) {
		return null;
	}

	// Toggle button always visible for dev/admin
	if (!visible) {
		return (
			<button
				type="button"
				onClick={() => setVisible(true)}
				onPointerDown={(e) => e.stopPropagation()}
				className="fixed bottom-4 left-4 flex h-8 w-8 items-center justify-center rounded bg-[#0f0f1a] border border-[#0FACED]/40 text-[#0FACED] text-xs font-mono opacity-60 hover:opacity-100 transition-opacity pointer-events-auto"
				style={{ zIndex: 50 }}
				title="Open Debug Panel (Ctrl+Shift+D)"
			>
				{">>"}
			</button>
		);
	}

	const tabs: Tab[] = ["STATS", "CONSTANTS", "CHEATS"];

	return (
		<div
			ref={panelRef}
			className="debug-crt fixed"
			style={{
				position: "fixed",
				left: position.x,
				top: position.y,
				width: minimized ? 220 : 300,
				zIndex: 50,
			}}
		>
			{/* Title bar */}
			<div className="debug-crt-title" onMouseDown={handleMouseDown}>
				<span
					style={{
						fontSize: "7px",
						fontFamily: "'Press Start 2P', monospace",
						letterSpacing: "1px",
					}}
				>
					{">"} DEBUG_TERMINAL
				</span>
				<button
					type="button"
					className="debug-minimize-btn"
					onClick={(e) => {
						e.stopPropagation();
						setMinimized((v) => !v);
					}}
				>
					{minimized ? "+" : "-"}
				</button>
			</div>

			{!minimized && (
				<div className="debug-crt-body">
					{/* Tabs */}
					<div className="flex gap-1 p-1 border-b border-[#0FACED]/30">
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab}
								className={`debug-tab ${activeTab === tab ? "debug-tab-active" : ""}`}
								onClick={() => setActiveTab(tab)}
							>
								{tab}
							</button>
						))}
					</div>

					{/* Tab content */}
					<div
						className="max-h-[60vh] overflow-y-auto"
						style={{
							scrollbarWidth: "thin",
							scrollbarColor: "#0FACED #0f0f1a",
						}}
					>
						{activeTab === "STATS" && <StatsTab state={debugState} />}
						{activeTab === "CONSTANTS" && <ConstantsTab onSendCommand={onSendCommand} />}
						{activeTab === "CHEATS" && (
							<CheatsTab debugState={debugState} onSendCommand={onSendCommand} gameKey={gameKey} />
						)}
					</div>

					{/* Footer */}
					<div
						className="border-t border-[#0FACED]/30 p-1"
						style={{
							fontSize: "6px",
							fontFamily: "'Press Start 2P', monospace",
						}}
					>
						<span className="debug-label">CTRL+SHIFT+D TO CLOSE</span>
					</div>
				</div>
			)}
		</div>
	);
}
