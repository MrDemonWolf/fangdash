"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTRPC } from "@/lib/trpc.ts";
import { Switch } from "@/components/ui/switch";

type Tab = "audio" | "skins" | "stats" | "leaderboard" | "controls" | "hud" | "quit";

interface PlayMenuProps {
	onClose: () => void;
	muted: boolean;
	volume: number;
	onToggleMute: () => void;
	onVolumeChange: (v: number) => void;
	isSignedIn: boolean;
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

function AudioTab({
	muted,
	volume,
	onToggleMute,
	onVolumeChange,
}: Pick<PlayMenuProps, "muted" | "volume" | "onToggleMute" | "onVolumeChange">) {
	return (
		<div className="space-y-6">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">
				Audio Settings
			</h3>
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={onToggleMute}
					className="p-2 rounded border border-white/10 bg-white/5 text-white/60 hover:text-[#0FACED] hover:border-[#0FACED]/40 transition-colors"
					aria-label={muted ? "Unmute" : "Mute"}
				>
					<SpeakerIcon muted={muted} />
				</button>
				<div className="flex-1 space-y-1">
					<div className="flex justify-between text-xs text-white/40 font-mono">
						<span>Volume</span>
						<span>{Math.round((muted ? 0 : volume) * 100)}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={muted ? 0 : volume}
						onChange={(e) => onVolumeChange(Number.parseFloat(e.target.value))}
						className="w-full h-1 accent-[#0FACED] cursor-pointer"
						aria-label="Volume"
					/>
				</div>
			</div>
		</div>
	);
}

function SkinsTab({ isSignedIn }: { isSignedIn: boolean }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: gallery, isLoading } = useQuery(
		trpc.skin.gallery.queryOptions(undefined, { enabled: isSignedIn }),
	);
	const { data: equipped } = useQuery(
		trpc.skin.getEquippedSkin.queryOptions(undefined, {
			enabled: isSignedIn,
		}),
	);
	const { mutate: equipSkin, isPending } = useMutation(
		trpc.skin.equipSkin.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.skin.getEquippedSkin.queryKey(),
				});
			},
		}),
	);

	if (!isSignedIn) {
		return <p className="text-sm text-white/40">Sign in to view and equip skins.</p>;
	}
	if (isLoading) {
		return <p className="text-sm text-white/40 animate-pulse">Loading skins\u2026</p>;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">Skins</h3>
			<div className="grid grid-cols-3 gap-3">
				{gallery?.map((skin) => {
					const isEquipped = equipped?.skinId === skin.id;
					return (
						<button
							type="button"
							key={skin.id}
							disabled={!skin.unlocked || isPending}
							onClick={() => skin.unlocked && !isEquipped && equipSkin({ skinId: skin.id })}
							className={[
								"relative p-3 rounded border text-left transition-all",
								isEquipped
									? "border-[#0FACED] bg-[#0FACED]/10 shadow-[0_0_12px_rgba(15,172,237,0.2)]"
									: skin.unlocked
										? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 cursor-pointer"
										: "border-white/5 bg-white/2 opacity-50 cursor-not-allowed",
							].join(" ")}
						>
							<p className="text-xs font-mono font-bold text-white/80 truncate">{skin.name}</p>
							{!skin.unlocked && <p className="text-[10px] text-white/30 mt-0.5">Locked</p>}
							{isEquipped && (
								<span className="absolute top-1.5 right-1.5 text-[10px] font-mono text-[#0FACED] font-bold">
									ON
								</span>
							)}
						</button>
					);
				})}
			</div>
			<p className="text-xs text-white/30">Changes take effect on the next run.</p>
		</div>
	);
}

function StatsTab({ isSignedIn }: { isSignedIn: boolean }) {
	const trpc = useTRPC();
	const { data: stats, isLoading } = useQuery(
		trpc.score.getPlayerStats.queryOptions(undefined, {
			enabled: isSignedIn,
		}),
	);

	if (!isSignedIn) {
		return <p className="text-sm text-white/40">Sign in to view your stats.</p>;
	}
	if (isLoading) {
		return <p className="text-sm text-white/40 animate-pulse">Loading stats\u2026</p>;
	}
	if (!stats) {
		return <p className="text-sm text-white/40">No stats yet. Play a game!</p>;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">Your Stats</h3>
			<div className="grid grid-cols-2 gap-3">
				{[
					{
						label: "Games Played",
						value: stats.gamesPlayed.toLocaleString(),
					},
					{
						label: "Total Score",
						value: stats.totalScore.toLocaleString(),
					},
					{
						label: "Total Distance",
						value: `${Math.floor(stats.totalDistance).toLocaleString()} m`,
					},
					{
						label: "Obstacles Cleared",
						value: stats.totalObstaclesCleared.toLocaleString(),
					},
				].map(({ label, value }) => (
					<div key={label} className="p-3 rounded border border-white/10 bg-white/5">
						<p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</p>
						<p className="text-xl font-bold font-mono tabular-nums text-white/90 mt-1">{value}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function LeaderboardTab() {
	const trpc = useTRPC();
	const { data: entries, isLoading } = useQuery(trpc.score.leaderboard.queryOptions({ limit: 10 }));

	if (isLoading) {
		return <p className="text-sm text-white/40 animate-pulse">Loading leaderboard\u2026</p>;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">Top 10</h3>
			<div className="space-y-1">
				{entries?.map((entry) => (
					<div
						key={entry.scoreId}
						className="flex items-center gap-3 px-3 py-2 rounded border border-white/5 bg-white/3 hover:bg-white/5 transition-colors"
					>
						<span
							className={[
								"w-6 text-center text-sm font-mono font-bold",
								entry.rank === 1
									? "text-yellow-400"
									: entry.rank === 2
										? "text-slate-300"
										: entry.rank === 3
											? "text-amber-600"
											: "text-white/30",
							].join(" ")}
						>
							{entry.rank}
						</span>
						<span className="flex-1 text-sm font-mono text-white/80 truncate">
							{entry.username ?? "Anonymous"}
						</span>
						<span className="text-sm font-mono font-bold tabular-nums text-[#0FACED]">
							{entry.score.toLocaleString()}
						</span>
					</div>
				))}
				{entries?.length === 0 && (
					<p className="text-sm text-white/40">No scores yet. Be the first!</p>
				)}
			</div>
		</div>
	);
}

const HUD_SETTINGS = [
	{
		key: "fangdash:hud-input" as const,
		label: "Input Overlay",
		description: "Show SPACE/click key indicators",
	},
	{
		key: "fangdash:hud-leaderboard" as const,
		label: "Leaderboard",
		description: "Show in-game leaderboard sidebar",
	},
	{
		key: "fangdash:hud-score" as const,
		label: "Score",
		description: "Show score, distance and time",
	},
] as const;

type HudKey = (typeof HUD_SETTINGS)[number]["key"];

function readHudSetting(key: HudKey): boolean {
	try {
		const stored = localStorage.getItem(key);
		return stored === null ? true : stored !== "false";
	} catch {
		return true;
	}
}

function writeHudSetting(key: HudKey, value: boolean) {
	try {
		localStorage.setItem(key, String(value));
	} catch {
		// localStorage unavailable
	}
}

function HudTab() {
	const [values, setValues] = useState<Record<HudKey, boolean>>(() => {
		const result = {} as Record<HudKey, boolean>;
		for (const s of HUD_SETTINGS) {
			result[s.key] = readHudSetting(s.key);
		}
		return result;
	});

	function toggle(key: HudKey) {
		const next = !values[key];
		writeHudSetting(key, next);
		setValues((prev) => ({ ...prev, [key]: next }));
	}

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">
				HUD Settings
			</h3>
			<div className="space-y-3">
				{HUD_SETTINGS.map((setting) => (
					<div
						key={setting.key}
						className="flex items-center justify-between gap-4 px-3 py-2.5 rounded border border-white/10 bg-white/5"
					>
						<div>
							<p className="text-sm font-mono text-white/80">{setting.label}</p>
							<p className="text-[10px] text-white/40 mt-0.5">{setting.description}</p>
						</div>
						<Switch
							checked={values[setting.key]}
							onCheckedChange={() => toggle(setting.key)}
							aria-label={setting.label}
						/>
					</div>
				))}
			</div>
			<p className="text-xs text-white/30">Changes take effect on the next run.</p>
		</div>
	);
}

function ControlsTab() {
	return (
		<div className="space-y-4">
			<h3 className="text-sm font-mono uppercase tracking-widest text-[#0FACED]/60">Controls</h3>
			<div className="space-y-3">
				{[
					{ key: "Space / Click", action: "Jump" },
					{ key: "Space / Click (mid-air)", action: "Double Jump" },
					{ key: "Escape", action: "Open / Close Menu" },
				].map(({ key, action }) => (
					<div
						key={key}
						className="flex items-center justify-between gap-4 px-3 py-2 rounded border border-white/10 bg-white/5"
					>
						<kbd className="px-2 py-1 rounded bg-white/10 text-xs font-mono text-white/70">
							{key}
						</kbd>
						<span className="text-sm text-white/60">{action}</span>
					</div>
				))}
			</div>
			<p className="text-sm text-white/40 mt-4">
				Survive as long as possible. The game gets faster over time!
			</p>
		</div>
	);
}

export function PlayMenu({
	onClose,
	muted,
	volume,
	onToggleMute,
	onVolumeChange,
	isSignedIn,
}: PlayMenuProps) {
	const [activeTab, setActiveTab] = useState<Tab>("audio");
	const router = useRouter();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const tabs: { id: Tab; label: string }[] = [
		{ id: "audio", label: "Audio" },
		{ id: "skins", label: "Skins" },
		{ id: "stats", label: "Stats" },
		{ id: "leaderboard", label: "Board" },
		{ id: "controls", label: "Keys" },
		{ id: "hud", label: "HUD" },
		{ id: "quit", label: "Quit" },
	];

	return (
		<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="relative w-full max-w-lg mx-3 sm:mx-4 rounded-xl border border-[#0FACED]/20 bg-[#091533]/95 shadow-[0_0_60px_rgba(15,172,237,0.15)] overflow-hidden max-h-[90dvh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 shrink-0">
					<span className="text-base font-mono font-bold uppercase tracking-widest text-white/80">
						Menu
					</span>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
						aria-label="Close menu"
					>
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
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				{/* Tab bar: horizontal scroll on mobile, sidebar on sm+ */}
				<div className="flex flex-col sm:flex-row flex-1 min-h-0">
					{/* Mobile: horizontal scrolling tab bar */}
					<div
						className="flex sm:hidden overflow-x-auto border-b border-white/10 shrink-0"
						style={{ scrollbarWidth: "none" }}
					>
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab.id}
								onClick={() => {
									if (tab.id === "quit") {
										router.push("/");
									} else {
										setActiveTab(tab.id);
									}
								}}
								className={[
									"px-4 py-2.5 text-xs font-mono whitespace-nowrap transition-colors shrink-0",
									tab.id === "quit"
										? "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
										: activeTab === tab.id
											? "text-[#0FACED] bg-[#0FACED]/10 border-b-2 border-[#0FACED]"
											: "text-white/40 hover:text-white/70 hover:bg-white/5",
								].join(" ")}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Desktop: vertical sidebar */}
					<div className="hidden sm:flex flex-col w-32 border-r border-white/10 py-3 shrink-0">
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab.id}
								onClick={() => {
									if (tab.id === "quit") {
										router.push("/");
									} else {
										setActiveTab(tab.id);
									}
								}}
								className={[
									"px-4 py-2.5 text-left text-xs font-mono transition-colors",
									tab.id === "quit"
										? "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
										: activeTab === tab.id
											? "text-[#0FACED] bg-[#0FACED]/10 border-r-2 border-[#0FACED]"
											: "text-white/40 hover:text-white/70 hover:bg-white/5",
								].join(" ")}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Tab content */}
					<div className="flex-1 p-4 sm:p-5 overflow-y-auto min-h-[200px] sm:min-h-[280px]">
						{activeTab === "audio" && (
							<AudioTab
								muted={muted}
								volume={volume}
								onToggleMute={onToggleMute}
								onVolumeChange={onVolumeChange}
							/>
						)}
						{activeTab === "skins" && <SkinsTab isSignedIn={isSignedIn} />}
						{activeTab === "stats" && <StatsTab isSignedIn={isSignedIn} />}
						{activeTab === "leaderboard" && <LeaderboardTab />}
						{activeTab === "controls" && <ControlsTab />}
						{activeTab === "hud" && <HudTab />}
					</div>
				</div>
			</div>
		</div>
	);
}
