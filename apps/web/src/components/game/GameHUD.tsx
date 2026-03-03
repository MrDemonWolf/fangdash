"use client";

interface GameHUDProps {
  score: number;
  distance: number;
  elapsedTime: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function GameHUD({ score, distance, elapsedTime }: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center gap-6 px-4 py-3 m-3 rounded-lg bg-black/50 backdrop-blur-sm w-fit">
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
    </div>
  );
}
