"use client";

import { formatTime } from "@/lib/format-time.ts";

interface GameHUDProps {
	score: number;
	distance: number;
	elapsedTime: number;
	muted?: boolean;
	onToggleMute?: () => void;
	onOpenMenu?: (() => void) | undefined;
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
				className="flex items-center justify-between px-4 py-2.5 glass"
				style={{
					borderBottom: "1px solid oklch(0.72 0.15 210 / 0.15)",
					boxShadow: "0 4px 30px rgba(15,172,237,0.06)",
				}}
			>
				{/* Stats — vertical stack */}
				<div className="flex flex-col gap-0.5">
					{/* Score label */}
					<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/50">
						Score
					</span>
					{/* Score value */}
					<span className="text-glow-cyan text-3xl font-black font-mono tabular-nums leading-none text-primary">
						{String(Math.floor(score)).padStart(7, "0")}
					</span>
					{/* Dist + Time row */}
					<div className="flex items-center gap-5 mt-1">
						<div className="flex items-center gap-1.5">
							<span className="text-[10px] font-mono uppercase tracking-[0.15em] text-foreground/30">
								Dist
							</span>
							<span className="text-lg font-bold font-mono tabular-nums leading-none text-foreground/80">
								{Math.floor(distance).toLocaleString()}
								<span className="text-xs text-foreground/30 ml-0.5">m</span>
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-[10px] font-mono uppercase tracking-[0.15em] text-foreground/30">
								Time
							</span>
							<span className="text-lg font-bold font-mono tabular-nums leading-none text-foreground/80">
								{formatTime(elapsedTime)}
							</span>
						</div>
					</div>
				</div>

				{/* Right controls */}
				<div className="pointer-events-auto flex items-center gap-4">
					{/* Mute button */}
					{onToggleMute && (
						<button
							type="button"
							onClick={onToggleMute}
							className="text-foreground/40 hover:text-primary hover:drop-shadow-[0_0_6px_rgba(15,172,237,0.4)] transition-all duration-200"
							aria-label={muted ? "Unmute" : "Mute"}
						>
							<SpeakerIcon muted={muted} />
						</button>
					)}

					{/* Pause text button */}
					{onOpenMenu && (
						<button
							type="button"
							onClick={onOpenMenu}
							className="text-xs font-mono uppercase tracking-[0.15em] text-foreground/35 hover:text-primary transition-colors duration-200"
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
