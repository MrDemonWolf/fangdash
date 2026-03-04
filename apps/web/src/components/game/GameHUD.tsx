"use client";

interface GameHUDProps {
  score: number;
  distance: number;
  elapsedTime: number;
  muted?: boolean;
  volume?: number;
  onToggleMute?: () => void;
  onVolumeChange?: (v: number) => void;
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
        width="18"
        height="18"
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
      width="18"
      height="18"
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
}: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between m-3">
        <div className="flex items-center gap-6 px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm w-fit">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Score
            </span>
            <span className="text-lg font-bold tabular-nums text-[#0FACED]">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="h-8 w-px bg-white/20" />

          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Distance
            </span>
            <span className="text-lg font-bold tabular-nums text-white">
              {Math.floor(distance).toLocaleString()}m
            </span>
          </div>

          <div className="h-8 w-px bg-white/20" />

          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Time
            </span>
            <span className="text-lg font-bold tabular-nums text-white">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Audio controls */}
        {onToggleMute && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm">
            <button
              onClick={onToggleMute}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={muted ? "Unmute" : "Mute"}
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
                className="w-16 h-1 accent-[#0FACED] cursor-pointer"
                aria-label="Volume"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
