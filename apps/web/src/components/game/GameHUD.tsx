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
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
  onToggleMute,
  onOpenMenu,
}: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div
        className="flex items-center justify-between px-3 py-2 bg-[#091533]/90 backdrop-blur-md border-b border-[#0FACED]/20"
        style={{ boxShadow: "0 2px 20px rgba(15,172,237,0.08)" }}
      >
        {/* Stats — vertical stack */}
        <div className="flex flex-col gap-0.5">
          {/* Score label */}
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#0FACED]/60">
            Score
          </span>
          {/* Score value */}
          <span
            className="text-3xl font-bold font-mono tabular-nums leading-none text-[#0FACED]"
            style={{
              textShadow: "0 0 10px #0FACED, 0 0 20px rgba(15,172,237,0.4)",
            }}
          >
            {String(Math.floor(score)).padStart(7, "0")}
          </span>
          {/* Dist + Time row */}
          <div className="flex items-center gap-4 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                Dist
              </span>
              <span className="text-lg font-bold font-mono tabular-nums leading-none text-white/80">
                {Math.floor(distance).toLocaleString()}
                <span className="text-xs text-white/40 ml-0.5">m</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                Time
              </span>
              <span className="text-lg font-bold font-mono tabular-nums leading-none text-white/80">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className="text-white/60 hover:text-[#0FACED] transition-colors disabled:opacity-30"
            aria-label={muted ? "Unmute" : "Mute"}
            disabled={!onToggleMute}
          >
            <SpeakerIcon muted={muted} />
          </button>

          {/* Pause text button */}
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-[#0FACED] transition-colors"
              aria-label="Open menu"
            >
              PAUSE [ESC]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
