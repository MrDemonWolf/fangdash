"use client";

import Link from "next/link";

interface RaceResultEntry {
	playerId: string;
	username: string;
	placement: number;
	score: number;
	distance: number;
}

interface RaceResultModalProps {
	results: RaceResultEntry[];
	onRematch?: () => void;
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

export function RaceResultModal({ results, onRematch }: RaceResultModalProps) {
	const sorted = [...results].sort((a, b) => a.placement - b.placement);
	const winner = sorted[0];

	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="w-full max-w-md mx-4 rounded-xl border border-white/10 bg-[#091533]/95 p-8 shadow-2xl shadow-[#0FACED]/10">
				<h2 className="mb-1 text-center text-3xl font-extrabold tracking-tight text-[var(--color-fang-gold)]">
					Race Results
				</h2>
				{winner && (
					<p className="mb-6 text-center text-sm text-white/50">
						<span className="font-semibold text-[#0FACED]">
							{winner.username}
						</span>{" "}
						wins the race!
					</p>
				)}

				<div className="mb-8 space-y-2">
					{sorted.map((entry) => {
						const isWinner = entry.placement === 1;
						return (
							<div
								key={entry.playerId}
								className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
									isWinner
										? "bg-[#0FACED]/10 border border-[#0FACED]/30"
										: "bg-white/5"
								}`}
							>
								<span
									className={`w-10 text-center text-sm font-bold ${
										isWinner ? "text-[var(--color-fang-gold)]" : "text-white/40"
									}`}
								>
									{placementLabel(entry.placement)}
								</span>

								<span
									className={`flex-1 truncate text-sm font-semibold ${
										isWinner ? "text-white" : "text-white/70"
									}`}
								>
									{entry.username}
								</span>

								<div className="flex items-center gap-4 text-right">
									<div className="flex flex-col">
										<span className="text-[9px] font-medium uppercase tracking-wider text-white/40">
											Score
										</span>
										<span className="text-sm font-bold tabular-nums text-[#0FACED]">
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
							className="w-full cursor-pointer rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
						>
							Rematch
						</button>
					)}

					<Link
						href="/"
						className="block w-full rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
					>
						Back to Lobby
					</Link>
				</div>
			</div>
		</div>
	);
}
