"use client";

interface GameHUDProps {
  score: number;
  distance: number;
  elapsedTime: number;
  muted?: boolean;
  volume?: number;
  onToggleMute?: () => void;
  onVolumeChange?: (v: number) => void;
  onOpenMenu?: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

export function GameHUD({
  score,
  distance,
  elapsedTime,
  muted = false,
  volume = 0.5,
  onToggleMute,
  onVolumeChange,
  onOpenMenu,
}: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div
        className="flex items-center justify-between px-3 py-2 bg-[#091533]/90 backdrop-blur-md border-b border-[#0FACED]/20"
        style={{ boxShadow: "0 2px 20px rgba(15,172,237,0.08)" }}
      >
        {/* Stats */}
        <div className="flex items-center gap-1">
          {/* Score — hero stat */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: "rgba(15,172,237,0.07)",
              border: "1px solid rgba(15,172,237,0.25)",
            }}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0FACED]/60">
              Score
            </span>
            <span
              className="text-2xl font-bold font-mono tabular-nums leading-none text-[#0FACED]"
              style={{
                textShadow: "0 0 10px #0FACED, 0 0 20px rgba(15,172,237,0.4)",
              }}
            >
              {score.toLocaleString()}
            </span>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Distance */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Dist
            </span>
            <span className="text-lg font-bold font-mono tabular-nums leading-none text-white/80">
              {Math.floor(distance).toLocaleString()}
              <span className="text-xs text-white/40 ml-0.5">m</span>
            </span>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Time */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Time
            </span>
            <span className="text-lg font-bold font-mono tabular-nums leading-none text-white/80">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Audio controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-white/5">
            <button
              onClick={onToggleMute}
              className="text-white/60 hover:text-[#0FACED] transition-colors disabled:opacity-30"
              aria-label={muted ? "Unmute" : "Mute"}
              disabled={!onToggleMute}
            >
              <SpeakerIcon muted={muted} />
            </button>
            {onVolumeChange && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-0.5 accent-[#0FACED] cursor-pointer"
                aria-label="Volume"
              />
            )}
          </div>
          {/* Menu button */}
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="p-1.5 rounded border border-white/10 bg-white/5 text-white/60 hover:text-[#0FACED] hover:border-[#0FACED]/40 transition-colors"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
