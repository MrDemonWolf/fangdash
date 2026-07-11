"use client";
import { useEffect, useState } from "react";
import { assetPath } from "@/lib/site.ts";

interface Racer {
	name: string;
	skin: string; // wolf sprite key, e.g. "wolf-shadow"
	tint: string;
	base: number;
}

const RACERS: Racer[] = [
	{ name: "ShadowFang", skin: "wolf-shadow", tint: "var(--purple)", base: 18420 },
	{ name: "BloodMoon", skin: "wolf-blood-moon", tint: "var(--orange)", base: 16905 },
	{ name: "StormRunner", skin: "wolf-storm", tint: "var(--brand-500)", base: 15110 },
	{ name: "EmberPup", skin: "wolf-fire", tint: "var(--gold)", base: 12680 },
];

const MEDALS = ["var(--gold)", "#c7d2e5", "#cd7f32"];

export function LeaderboardCard({ compact = false }: { compact?: boolean }) {
	const [tick, setTick] = useState(0);

	// A gentle "live race" pulse: the leader's score ticks up until the round
	// resets. Purely decorative — disabled under reduced-motion.
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const id = setInterval(() => setTick((t) => (t + 1) % 40), 900);
		return () => clearInterval(id);
	}, []);

	const rows = RACERS.slice(0, compact ? 3 : 4);

	return (
		<div
			className="fd-glass w-full overflow-hidden"
			style={{ padding: "1.25rem", maxWidth: 420 }}
			role="img"
			aria-label="A FangDash live race leaderboard with four wolves ranked by score."
		>
			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<span className="fd-mono text-xs tracking-widest" style={{ color: "var(--brand-500)" }}>
					LIVE RACE
				</span>
				<span
					className="fd-mono inline-flex items-center gap-2 text-[0.7rem]"
					style={{ color: "var(--txt-2)" }}
				>
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ background: "#ef4444", boxShadow: "0 0 10px #ef4444" }}
						aria-hidden="true"
					/>
					{rows.length} WOLVES
				</span>
			</div>

			<div className="flex flex-col gap-1.5">
				{rows.map((r, i) => {
					const score = i === 0 ? r.base + tick * 10 : r.base;
					return (
						<div
							key={r.name}
							className="flex items-center gap-3 rounded-xl px-2.5 py-2"
							style={{
								background:
									i === 0 ? "color-mix(in srgb, var(--gold) 10%, transparent)" : "transparent",
								border: `1px solid ${i === 0 ? "color-mix(in srgb, var(--gold) 35%, transparent)" : "transparent"}`,
							}}
						>
							<span
								className="fd-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
								style={{
									color: MEDALS[i] ?? "var(--txt-2)",
									border: `1px solid ${MEDALS[i] ?? "var(--hairline)"}`,
									background: `color-mix(in srgb, ${MEDALS[i] ?? "var(--hairline)"} 14%, transparent)`,
								}}
							>
								{i + 1}
							</span>
							<span
								className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
								style={{ background: `color-mix(in srgb, ${r.tint} 22%, var(--bg-surface))` }}
							>
								{}
								<img
									src={assetPath(`/wolves/${r.skin}.png`)}
									alt=""
									aria-hidden="true"
									className="h-8 w-8 object-contain"
								/>
							</span>
							<span
								className="min-w-0 flex-1 truncate text-sm font-semibold"
								style={{ color: "var(--txt-1)" }}
							>
								{r.name}
							</span>
							<span
								className="fd-mono text-sm font-bold tabular-nums"
								style={{ color: i === 0 ? "var(--gold)" : "var(--txt-1)" }}
							>
								{score.toLocaleString()}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
