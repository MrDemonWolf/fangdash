"use client";

import Link from "next/link";
import { rankColorClass } from "@/lib/format.ts";

interface RaceResultEntry {
	playerId: string;
	username: string;
	placement: number;
	score: number;
	distance: number;
}

interface RaceResultModalProps {
	results: RaceResultEntry[];
	myId?: string | undefined;
	onRematch?: (() => void) | undefined;
}

function placementLabel(placement: number): string {
	switch (placement) {
		case 1:
			return "1st";
		case 2:
			return "2nd";
		case 3:
			return "3rd";
		default:
			return `${placement}th`;
	}
}

export function RaceResultModal({ results, myId, onRematch }: RaceResultModalProps) {
	const sorted = [...results].sort((a, b) => a.placement - b.placement);
	const winner = sorted[0];

	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="w-full max-w-md mx-4 rounded-xl border border-white/10 bg-[#091533]/95 p-8 shadow-2xl shadow-fang-cyan/10 animate-in fade-in zoom-in-95 duration-300">
				<h2 className="mb-1 text-center text-3xl font-extrabold tracking-tight text-fang-gold text-glow-gold">
					Race Results
				</h2>
				{winner && (
					<p className="mb-6 text-center text-sm text-white/50">
						<span className="font-semibold text-fang-cyan">{winner.username}</span> wins the race!
					</p>
				)}

				<div className="mb-8 space-y-2">
					{sorted.map((entry) => {
						const isWinner = entry.placement === 1;
						const isMe = myId !== undefined && entry.playerId === myId;
						return (
							<div
								key={entry.playerId}
								className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
									isWinner
										? "bg-fang-cyan/10 border border-fang-cyan/30 shadow-[var(--glow-gold)]"
										: isMe
											? "bg-white/[0.07] border border-fang-cyan/20"
											: "bg-white/5"
								}`}
							>
								<span
									className={`w-10 text-center text-sm font-bold ${rankColorClass(entry.placement)}`}
								>
									{placementLabel(entry.placement)}
								</span>

								<span
									className={`flex-1 truncate text-sm font-semibold ${
										isWinner || isMe ? "text-white" : "text-white/70"
									}`}
								>
									{entry.username}
									{isMe && <span className="ml-1.5 text-xs font-normal text-fang-cyan">(you)</span>}
								</span>

								<div className="flex items-center gap-4 text-right">
									<div className="flex flex-col">
										<span className="text-[9px] font-medium uppercase tracking-wider text-white/40">
											Score
										</span>
										<span className="text-sm font-bold tabular-nums text-fang-cyan">
											{entry.score.toLocaleString()}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-[9px] font-medium uppercase tracking-wider text-white/40">
											Dist
										</span>
										<span className="text-sm font-bold tabular-nums text-white/70">
											{Math.floor(entry.distance).toLocaleString()}m
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="flex flex-col gap-3">
					{onRematch && (
						<button
							type="button"
							onClick={onRematch}
							className="w-full cursor-pointer rounded-lg bg-fang-cyan px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-fang-cyan/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#091533]"
						>
							Rematch
						</button>
					)}

					<Link
						href="/race"
						className="block w-full rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#091533]"
					>
						Back to Lobby
					</Link>
				</div>
			</div>
		</div>
	);
}
