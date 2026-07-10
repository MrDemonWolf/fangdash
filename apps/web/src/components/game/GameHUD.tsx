"use client";

import { decodeMods } from "@fangdash/shared";
import type { DifficultyName } from "@fangdash/shared";
import { formatScoreDisplay, formatTime } from "@/lib/format.ts";
import { InGameLeaderboard } from "./InGameLeaderboard.tsx";
import { InputOverlay } from "./InputOverlay.tsx";
import { SpeakerIcon } from "./SpeakerIcon.tsx";

interface GameHUDProps {
	score: number;
	distance: number;
	elapsedTime: number;
	muted?: boolean;
	onToggleMute?: () => void;
	onOpenMenu?: (() => void) | undefined;
	mods?: number;
	difficulty?: DifficultyName | undefined;
	showScore?: boolean;
	showInputOverlay?: boolean;
	showLeaderboard?: boolean;
}

export function GameHUD({
	score,
	distance,
	elapsedTime,
	muted = false,
	onToggleMute,
	onOpenMenu,
	mods = 0,
	difficulty,
	showScore = true,
	showInputOverlay = true,
	showLeaderboard = true,
}: GameHUDProps) {
	const activeMods = mods > 0 ? decodeMods(mods) : [];

	return (
		<div className="absolute inset-0 z-10 pointer-events-none">
			{/* Top bar */}
			<div
				className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-[#091533]/90 backdrop-blur-md border-b border-fang-cyan/20"
				style={{ boxShadow: "0 2px 20px rgba(15,172,237,0.08)" }}
			>
				{/* Stats — vertical stack */}
				{showScore && (
					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] font-mono uppercase tracking-widest text-fang-cyan/60">
							Score
						</span>
						<span
							className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none text-fang-cyan"
							style={{
								textShadow: "0 0 10px #0FACED, 0 0 20px rgba(15,172,237,0.4)",
							}}
						>
							{formatScoreDisplay(score)}
						</span>
						<div className="flex items-center gap-2 sm:gap-4 mt-0.5">
							<div className="flex items-center gap-1.5">
								<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
									Dist
								</span>
								<span className="text-sm sm:text-lg font-bold font-mono tabular-nums leading-none text-white/80">
									{Math.floor(distance).toLocaleString()}
									<span className="text-xs text-white/40 ml-0.5">m</span>
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
									Time
								</span>
								<span className="text-sm sm:text-lg font-bold font-mono tabular-nums leading-none text-white/80">
									{formatTime(elapsedTime)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Mod multiplier badges */}
				{activeMods.length > 0 && (
					<div className="flex items-center gap-1.5">
						{activeMods.map((mod) => (
							<span
								key={mod.id}
								className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-[10px] font-mono text-purple-300"
								title={mod.name}
							>
								<span>{mod.icon}</span>
								<span className="hidden sm:inline">{mod.name}</span>
								<span className="text-purple-400 font-bold">×{mod.multiplier.toFixed(1)}</span>
							</span>
						))}
					</div>
				)}

				{/* Right controls */}
				<div className="pointer-events-auto flex items-center gap-3">
					{onToggleMute && (
						<button
							type="button"
							onClick={onToggleMute}
							className="text-white/60 hover:text-fang-cyan transition-colors"
							aria-label={muted ? "Unmute" : "Mute"}
						>
							<SpeakerIcon muted={muted} />
						</button>
					)}
					{onOpenMenu && (
						<button
							type="button"
							onClick={onOpenMenu}
							className="hidden sm:block text-xs font-mono uppercase tracking-widest text-white/50 hover:text-fang-cyan transition-colors"
							aria-label="Open menu"
						>
							PAUSE [ESC]
						</button>
					)}
				</div>
			</div>

			<InputOverlay visible={showInputOverlay} />

			<InGameLeaderboard
				visible={showLeaderboard}
				difficulty={difficulty}
				mods={mods > 0 ? mods : undefined}
			/>
		</div>
	);
}
