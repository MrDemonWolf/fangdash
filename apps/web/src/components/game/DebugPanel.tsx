"use client";

import type { DebugCommand, DebugState } from "@fangdash/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";

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

import { Button } from "@/components/ui/button.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DebugPanelProps {
	debugState: DebugState | null;
	onSendCommand: (command: DebugCommand) => void;
	gameKey: number;
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------
function SectionHeader({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-2 pt-1.5 pb-0.5 first:pt-0">
			<span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#0FACED]/50 shrink-0">
				{children}
			</span>
			<div className="flex-1 h-px bg-[#0FACED]/10" />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stat Row
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
	const valueColor = danger ? "text-blue-300" : warn ? "text-blue-400" : "text-[#0FACED]";
	return (
		<div className="flex justify-between items-baseline gap-2">
			<span className="text-[10px] font-mono text-muted-foreground/70">{label}</span>
			<span className={`text-[10px] font-mono tabular-nums ${valueColor}`}>{value}</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Toggle Row
// ---------------------------------------------------------------------------
function ToggleRow({
	label,
	hint,
	checked,
	onToggle,
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onToggle: () => void;
}) {
	const labelEl = (
		<span className="text-[10px] font-mono text-muted-foreground/70 cursor-default">{label}</span>
	);
	return (
		<div className="flex items-center justify-between py-0.5">
			{hint ? (
				<Tooltip>
					<TooltipTrigger asChild>{labelEl}</TooltipTrigger>
					<TooltipContent side="right" className="max-w-48 text-xs">
						{hint}
					</TooltipContent>
				</Tooltip>
			) : (
				labelEl
			)}
			<Switch
				checked={checked}
				onCheckedChange={onToggle}
				className="data-[state=checked]:bg-[#0FACED] data-[state=unchecked]:bg-muted scale-[0.6]"
			/>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stats Tab
// ---------------------------------------------------------------------------
function StatsTab({ state }: { state: DebugState | null }) {
	if (!state) {
		return <div className="text-xs text-muted-foreground p-3">Waiting for game data...</div>;
	}

	return (
		<div className="space-y-0 px-2.5 py-1.5">
			<SectionHeader>Performance</SectionHeader>
			<StatRow label="FPS" value={state.fps} warn={state.fps < 30} danger={state.fps < 15} />
			<StatRow label="DELTA" value={`${state.frameDelta}ms`} />

			<SectionHeader>Player</SectionHeader>
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

			<SectionHeader>Scoring</SectionHeader>
			<StatRow label="SCORE" value={state.scoring.score} />
			<StatRow label="DIST" value={`${state.scoring.distance}m`} />
			<StatRow label="CLEARED" value={state.scoring.obstaclesCleared} />
			<StatRow label="SPEED" value={state.scoring.currentSpeed} />
			<StatRow label="TIME" value={`${Math.floor(state.scoring.elapsedMs / 1000)}s`} />

			<SectionHeader>Difficulty</SectionHeader>
			<StatRow label="LEVEL" value={state.difficulty.levelName.toUpperCase()} />
			<StatRow label="SPD-X" value={`${state.difficulty.speedMultiplier}x`} />
			<StatRow label="SPN-X" value={`${state.difficulty.spawnRateMultiplier}x`} />
			<StatRow label="GAP" value={`${state.difficulty.minGap}-${state.difficulty.maxGap}ms`} />

			<SectionHeader>Spawner</SectionHeader>
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
		name: "Physics",
		constants: [
			{ key: "GRAVITY", label: "GRAVITY", defaultValue: GRAVITY, min: 100, max: 3000, step: 50 },
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
			{ key: "MAX_JUMPS", label: "MAX-JMP", defaultValue: MAX_JUMPS, min: 1, max: 10, step: 1 },
		],
	},
	{
		name: "Speed",
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
		name: "Scoring",
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
		name: "Obstacles",
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
		<div className="space-y-0 px-2.5 py-1.5">
			{CONSTANT_GROUPS.map((group) => (
				<div key={group.name}>
					<SectionHeader>{group.name}</SectionHeader>
					{group.constants.map((c) => (
						<div key={c.key} className="flex items-center gap-2 py-0.5">
							<span className="text-[10px] font-mono text-muted-foreground/70 w-16 shrink-0">
								{c.label}
							</span>
							<Slider
								className="flex-1 [&_[data-slot=track]]:h-1 [&_[data-slot=thumb]]:size-3 [&_[data-slot=thumb]]:border"
								min={c.min}
								max={c.max}
								step={c.step}
								value={[values[c.key] ?? c.defaultValue]}
								onValueChange={(vals) => handleChange(c.key, vals[0] ?? c.defaultValue)}
							/>
							<span className="text-[10px] font-mono tabular-nums text-[#0FACED] w-12 text-right shrink-0">
								{values[c.key]}
							</span>
						</div>
					))}
				</div>
			))}
			<div className="pt-2">
				<Button variant="outline" size="sm" className="w-full text-xs" onClick={handleReset}>
					Reset Defaults
				</Button>
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
				queryClient.invalidateQueries({
					queryKey: trpc.skin.getUnlockedSkins.queryOptions().queryKey,
				});
			},
			onError: (err) => {
				setSkinUnlockStatus(`Error: ${err.message}`);
			},
		}),
	);

	const [localFlags, setLocalFlags] = useState<StoredDebugFlags>(loadDebugFlags);
	const [difficulty, setDifficulty] = useState(() => loadDebugFlags().difficulty);
	const prevGameKeyRef = useRef(-1);

	const hitboxes = debugState?.debug?.hitboxes ?? localFlags.hitboxes;
	const renderBoxes = debugState?.debug?.renderBoxes ?? localFlags.renderBoxes;
	const invincible = debugState?.debug?.invincible ?? localFlags.invincible;
	const speedMultiplier = debugState?.debug?.speedMultiplier ?? localFlags.speedMultiplier;

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

	const handleDifficultyChange = (value: string) => {
		const idx = Number.parseInt(value, 10);
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
		<div className="px-2.5 py-1.5 space-y-0">
			<SectionHeader>Visibility</SectionHeader>
			<ToggleRow
				label="HITBOX VIZ"
				hint="Show collision boxes on player and obstacles"
				checked={hitboxes}
				onToggle={toggleHitboxes}
			/>
			<ToggleRow
				label="RENDER VIZ"
				hint="Show sprite render boundaries"
				checked={renderBoxes}
				onToggle={toggleRenderBoxes}
			/>

			<SectionHeader>Invincibility</SectionHeader>
			<ToggleRow
				label="INVINCIBLE"
				hint="Player ignores all obstacle collisions"
				checked={invincible}
				onToggle={toggleInvincible}
			/>

			<SectionHeader>Game Overrides</SectionHeader>
			<div className="space-y-1 py-0.5">
				<div className="flex justify-between items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="text-[10px] font-mono text-muted-foreground/70 cursor-default">
								DIFFICULTY
							</span>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-48 text-xs">
							Override the difficulty level mid-game
						</TooltipContent>
					</Tooltip>
					<span className="text-[10px] font-mono text-[#0FACED]">
						{DIFFICULTY_NAMES[difficulty]}
					</span>
				</div>
				<Select value={String(difficulty)} onValueChange={handleDifficultyChange}>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DIFFICULTY_NAMES.map((name, idx) => (
							<SelectItem key={name} value={String(idx)}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-1 py-0.5">
				<div className="flex justify-between items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="text-[10px] font-mono text-muted-foreground/70 cursor-default">
								TIME SCALE
							</span>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-48 text-xs">
							Speed up or slow down the entire game (0.1x = slow motion, 3x = fast forward)
						</TooltipContent>
					</Tooltip>
					<span className="text-[10px] font-mono tabular-nums text-[#0FACED]">
						{speedMultiplier.toFixed(1)}x
					</span>
				</div>
				<Slider
					min={0.1}
					max={3.0}
					step={0.1}
					value={[speedMultiplier]}
					onValueChange={(vals) => handleSpeedMultiplierChange(vals[0] ?? 1.0)}
				/>
				<div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
					<span>0.1x</span>
					<span>3.0x</span>
				</div>
			</div>

			<SectionHeader>Actions</SectionHeader>
			<Button
				variant="outline"
				size="sm"
				className="w-full text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
				onClick={() => onSendCommand({ type: "force-game-over" })}
			>
				Force Game Over
			</Button>

			<SectionHeader>Skins</SectionHeader>
			<Button
				variant="outline"
				size="sm"
				className="w-full text-xs"
				onClick={() => {
					setSkinUnlockStatus(null);
					unlockAllSkins.mutate();
				}}
				disabled={unlockAllSkins.isPending}
			>
				{unlockAllSkins.isPending ? "Unlocking..." : "Unlock All Skins"}
			</Button>
			{skinUnlockStatus && (
				<p className="text-[10px] font-mono text-muted-foreground pt-1">{skinUnlockStatus}</p>
			)}

			<SectionHeader>Reset</SectionHeader>
			<Button variant="outline" size="sm" className="w-full text-xs" onClick={handleReset}>
				Reset Cheats
			</Button>
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
	const [position, setPosition] = useState({ x: 16, y: 80 });
	const dragging = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });
	const panelRef = useRef<HTMLDivElement>(null);

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
				className="fixed bottom-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-card/80 border border-[#0FACED]/30 text-[#0FACED] text-xs font-mono opacity-50 hover:opacity-100 transition-opacity pointer-events-auto backdrop-blur-sm"
				style={{ zIndex: 50 }}
				title="Open Debug Panel (Ctrl+Shift+D)"
			>
				{">>"}
			</button>
		);
	}

	return (
		<TooltipProvider delayDuration={200}>
			<div
				ref={panelRef}
				className="fixed rounded-xl border border-[#0FACED]/20 bg-card/95 backdrop-blur-xl shadow-[0_0_40px_rgba(15,172,237,0.1)] overflow-hidden"
				style={{
					left: position.x,
					top: position.y,
					width: minimized ? 200 : 280,
					zIndex: 50,
				}}
			>
				{/* Title bar */}
				<div
					className="flex items-center justify-between px-2.5 py-1.5 bg-muted/50 border-b border-[#0FACED]/15 cursor-grab active:cursor-grabbing select-none"
					onMouseDown={handleMouseDown}
				>
					<span className="text-[11px] font-mono font-medium tracking-wider text-[#0FACED]/80">
						Debug Panel
					</span>
					<button
						type="button"
						className="flex items-center justify-center w-5 h-5 rounded text-[#0FACED]/60 hover:text-[#0FACED] hover:bg-[#0FACED]/10 transition-colors text-xs font-mono cursor-pointer"
						onClick={(e) => {
							e.stopPropagation();
							setMinimized((v) => !v);
						}}
					>
						{minimized ? "+" : "\u2013"}
					</button>
				</div>

				{!minimized && (
					<Tabs defaultValue="stats">
						<TabsList className="mx-2 mt-1.5">
							<TabsTrigger value="stats" className="text-xs">
								Stats
							</TabsTrigger>
							<TabsTrigger value="constants" className="text-xs">
								Constants
							</TabsTrigger>
							<TabsTrigger value="cheats" className="text-xs">
								Cheats
							</TabsTrigger>
						</TabsList>

						<div className="max-h-[60vh] overflow-y-auto scrollbar-none">
							<TabsContent value="stats" className="mt-0">
								<StatsTab state={debugState} />
							</TabsContent>
							<TabsContent value="constants" className="mt-0">
								<ConstantsTab onSendCommand={onSendCommand} />
							</TabsContent>
							<TabsContent value="cheats" className="mt-0">
								<CheatsTab
									debugState={debugState}
									onSendCommand={onSendCommand}
									gameKey={gameKey}
								/>
							</TabsContent>
						</div>

						{/* Footer */}
						<div className="border-t border-[#0FACED]/10 px-2.5 py-1">
							<span className="text-[8px] font-mono text-muted-foreground/40">
								Ctrl+Shift+D to close
							</span>
						</div>
					</Tabs>
				)}
			</div>
		</TooltipProvider>
	);
}
