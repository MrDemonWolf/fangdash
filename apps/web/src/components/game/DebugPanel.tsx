"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DebugState, DebugCommand } from "@fangdash/shared";
import { useIsDevOrAdmin } from "@/lib/use-role";
import {
  GRAVITY,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  MAX_JUMPS,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  SPEED_INCREASE_INTERVAL_MS,
  SCORE_PER_SECOND,
  SCORE_PER_OBSTACLE,
  DISTANCE_MULTIPLIER,
  MIN_OBSTACLE_GAP_MS,
  MAX_OBSTACLE_GAP_MS,
} from "@fangdash/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = "STATS" | "CONSTANTS" | "CHEATS";

interface DebugPanelProps {
  debugState: DebugState | null;
  onSendCommand: (command: DebugCommand) => void;
}

// ---------------------------------------------------------------------------
// CRT CSS (injected once)
// ---------------------------------------------------------------------------
const CRT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.debug-crt {
  font-family: 'Press Start 2P', 'Courier New', monospace;
  background: #0a0a0a;
  color: #33ff33;
  border: 2px solid #33ff33;
  border-radius: 8px;
  box-shadow:
    0 0 10px rgba(51, 255, 51, 0.3),
    0 0 20px rgba(51, 255, 51, 0.1),
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
  background: #1a1a1a;
  border-bottom: 1px solid #33ff33;
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
  color: #33ff33;
  border: 1px solid #33ff33;
  padding: 3px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.15s;
}

.debug-tab:hover {
  background: rgba(51, 255, 51, 0.15);
  text-shadow: 0 0 6px #33ff33;
}

.debug-tab-active {
  background: #33ff33;
  color: #0a0a0a;
  text-shadow: none;
}

.debug-label {
  color: #888;
  font-size: 7px;
  line-height: 1.6;
}

.debug-value {
  color: #33ff33;
  font-size: 7px;
  text-shadow: 0 0 4px rgba(51, 255, 51, 0.5);
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
  font-size: 7px;
  border-bottom: 1px dashed #0FACED;
  padding-bottom: 2px;
  margin-bottom: 4px;
  margin-top: 6px;
  text-shadow: 0 0 4px rgba(15, 172, 237, 0.5);
}

.debug-btn {
  background: #1a1a1a;
  color: #33ff33;
  border: 1px solid #33ff33;
  padding: 4px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
}

.debug-btn:hover {
  background: #33ff33;
  color: #0a0a0a;
  box-shadow: 0 0 8px rgba(51, 255, 51, 0.4);
}

.debug-btn-danger {
  border-color: #ff3333;
  color: #ff3333;
}

.debug-btn-danger:hover {
  background: #ff3333;
  color: #0a0a0a;
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
  border: 1px solid #33ff33;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  flex-shrink: 0;
}

.debug-toggle-box-on {
  background: #33ff33;
  color: #0a0a0a;
  box-shadow: 0 0 6px rgba(51, 255, 51, 0.5);
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
  background: #1a1a1a;
  border: 1px solid #33ff33;
  outline: none;
}

.debug-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 14px;
  background: #33ff33;
  cursor: pointer;
  border: none;
}

.debug-slider::-moz-range-thumb {
  width: 10px;
  height: 14px;
  background: #33ff33;
  cursor: pointer;
  border: none;
}

.debug-select {
  background: #1a1a1a;
  color: #33ff33;
  border: 1px solid #33ff33;
  padding: 3px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
  outline: none;
}

.debug-select option {
  background: #0a0a0a;
  color: #33ff33;
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
  border: 1px solid #33ff33;
  color: #33ff33;
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
  background: #33ff33;
  color: #0a0a0a;
}
`;

// ---------------------------------------------------------------------------
// Stat Row component
// ---------------------------------------------------------------------------
function StatRow({ label, value, warn, danger }: { label: string; value: string | number; warn?: boolean; danger?: boolean }) {
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
      <StatRow label="ALIVE" value={state.player.alive ? "YES" : "NO"} danger={!state.player.alive} />
      <StatRow label="BOUNDS" value={`${state.player.bounds.width}x${state.player.bounds.height}`} />

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
      { key: "GRAVITY", label: "GRAVITY", defaultValue: GRAVITY, min: 100, max: 3000, step: 50 },
      { key: "JUMP_VELOCITY", label: "JUMP-V", defaultValue: JUMP_VELOCITY, min: -1000, max: -100, step: 10 },
      { key: "DOUBLE_JUMP_VELOCITY", label: "DJUMP-V", defaultValue: DOUBLE_JUMP_VELOCITY, min: -1000, max: -100, step: 10 },
      { key: "MAX_JUMPS", label: "MAX-JMP", defaultValue: MAX_JUMPS, min: 1, max: 10, step: 1 },
    ],
  },
  {
    name: "SPEED",
    constants: [
      { key: "BASE_SPEED", label: "BASE-SPD", defaultValue: BASE_SPEED, min: 50, max: 800, step: 10 },
      { key: "MAX_SPEED", label: "MAX-SPD", defaultValue: MAX_SPEED, min: 200, max: 2000, step: 50 },
      { key: "SPEED_INCREMENT", label: "SPD-INC", defaultValue: SPEED_INCREMENT, min: 0.1, max: 5, step: 0.1 },
      { key: "SPEED_INCREASE_INTERVAL_MS", label: "SPD-INT", defaultValue: SPEED_INCREASE_INTERVAL_MS, min: 100, max: 5000, step: 100 },
    ],
  },
  {
    name: "SCORING",
    constants: [
      { key: "SCORE_PER_SECOND", label: "SC/SEC", defaultValue: SCORE_PER_SECOND, min: 1, max: 100, step: 1 },
      { key: "SCORE_PER_OBSTACLE", label: "SC/OBS", defaultValue: SCORE_PER_OBSTACLE, min: 10, max: 500, step: 10 },
      { key: "DISTANCE_MULTIPLIER", label: "DIST-X", defaultValue: DISTANCE_MULTIPLIER, min: 0.01, max: 1, step: 0.01 },
    ],
  },
  {
    name: "OBSTACLES",
    constants: [
      { key: "MIN_OBSTACLE_GAP_MS", label: "MIN-GAP", defaultValue: MIN_OBSTACLE_GAP_MS, min: 200, max: 3000, step: 50 },
      { key: "MAX_OBSTACLE_GAP_MS", label: "MAX-GAP", defaultValue: MAX_OBSTACLE_GAP_MS, min: 500, max: 5000, step: 100 },
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
                  onChange={(e) => handleChange(c.key, parseFloat(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="pt-2">
        <button className="debug-btn-danger debug-btn w-full" onClick={handleReset}>
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

function CheatsTab({ onSendCommand }: { onSendCommand: (cmd: DebugCommand) => void }) {
  const [hitboxes, setHitboxes] = useState(false);
  const [invincible, setInvincible] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [difficulty, setDifficulty] = useState(0);

  const toggleHitboxes = () => {
    setHitboxes((v) => !v);
    onSendCommand({ type: "toggle-hitboxes" });
  };

  const toggleInvincibility = () => {
    setInvincible((v) => !v);
    onSendCommand({ type: "toggle-invincibility" });
  };

  const handleSpeedChange = (val: number) => {
    setSpeedMultiplier(val);
    onSendCommand({ type: "set-speed-multiplier", payload: val });
  };

  const handleDifficultyChange = (idx: number) => {
    setDifficulty(idx);
    onSendCommand({ type: "set-difficulty", payload: idx });
  };

  const handleForceGameOver = () => {
    onSendCommand({ type: "force-game-over" });
  };

  return (
    <div className="space-y-3 p-2">
      <div className="debug-section-header">{"// TOGGLES"}</div>

      <label className="debug-toggle" onClick={toggleHitboxes}>
        <span className={`debug-toggle-box ${hitboxes ? "debug-toggle-box-on" : ""}`}>
          {hitboxes ? "X" : ""}
        </span>
        <span className="debug-label">HITBOX VIZ</span>
      </label>

      <label className="debug-toggle" onClick={toggleInvincibility}>
        <span className={`debug-toggle-box ${invincible ? "debug-toggle-box-on" : ""}`}>
          {invincible ? "X" : ""}
        </span>
        <span className="debug-label">INVINCIBILITY</span>
      </label>

      <div className="debug-section-header">{"// DIFFICULTY"}</div>
      <div>
        <select
          className="debug-select w-full"
          value={difficulty}
          onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
        >
          {DIFFICULTY_NAMES.map((name, idx) => (
            <option key={name} value={idx}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="debug-section-header">{"// SPEED MULTIPLIER"}</div>
      <div>
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
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="debug-section-header">{"// ACTIONS"}</div>
      <button className="debug-btn-danger debug-btn w-full" onClick={handleForceGameOver}>
        FORCE GAME OVER
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DebugPanel Component
// ---------------------------------------------------------------------------
export default function DebugPanel({ debugState, onSendCommand }: DebugPanelProps) {
  const isDevOrAdmin = useIsDevOrAdmin();
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
    if (styleInjected.current) return;
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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
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

  if (!mounted || !isDevOrAdmin) return null;

  // Toggle button always visible for dev/admin
  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed bottom-4 left-4 flex h-8 w-8 items-center justify-center rounded bg-[#0a0a0a] border border-[#33ff33]/40 text-[#33ff33] text-xs font-mono opacity-60 hover:opacity-100 transition-opacity pointer-events-auto"
        style={{ zIndex: 99999 }}
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
      className="debug-crt fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        width: minimized ? 220 : 280,
      }}
    >
      {/* Title bar */}
      <div className="debug-crt-title" onMouseDown={handleMouseDown}>
        <span style={{ fontSize: "7px", fontFamily: "'Press Start 2P', monospace", letterSpacing: "1px" }}>
          {">"} DEBUG_TERMINAL
        </span>
        <button
          className="debug-minimize-btn"
          onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}
        >
          {minimized ? "+" : "-"}
        </button>
      </div>

      {!minimized && (
        <div className="debug-crt-body">
          {/* Tabs */}
          <div className="flex gap-1 p-1 border-b border-[#33ff33]/30">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`debug-tab ${activeTab === tab ? "debug-tab-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#33ff33 #0a0a0a" }}>
            {activeTab === "STATS" && <StatsTab state={debugState} />}
            {activeTab === "CONSTANTS" && <ConstantsTab onSendCommand={onSendCommand} />}
            {activeTab === "CHEATS" && <CheatsTab onSendCommand={onSendCommand} />}
          </div>

          {/* Footer */}
          <div className="border-t border-[#33ff33]/30 p-1" style={{ fontSize: "6px", fontFamily: "'Press Start 2P', monospace" }}>
            <span className="debug-label">CTRL+SHIFT+D TO CLOSE</span>
          </div>
        </div>
      )}
    </div>
  );
}
