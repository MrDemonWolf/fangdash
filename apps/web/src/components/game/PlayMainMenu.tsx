"use client";
import { DIFFICULTY_LEVELS, getScoreMultiplier, MOD_DEFINITIONS } from "@fangdash/shared";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatScoreDisplay } from "@/lib/format.ts";

interface PlayMainMenuProps {
	onPlay: () => void;
	skinKey: string;
	isSignedIn: boolean;
	bestScore: number;
	selectedDifficulty: string;
	onSelectDifficulty: (d: string) => void;
	selectedMods: number;
	onSelectMods: (mods: number) => void;
	userName?: string | undefined;
	userImage?: string | undefined;
	isPending?: boolean;
	onSignIn: () => void;
	onSignOut: () => void;
}

function UserPill({
	userName,
	userImage,
	onSignOut,
}: {
	userName?: string | undefined;
	userImage?: string | undefined;
	onSignOut: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 backdrop-blur-xl transition-colors hover:border-primary/30 hover:bg-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{userImage && (
						<img
							src={userImage}
							alt={userName ?? "User avatar"}
							className="h-6 w-6 rounded-full border border-primary/50"
						/>
					)}
					<span className="text-sm font-medium text-foreground">{userName}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link href="/profile" className="cursor-pointer">
						<User className="size-4" />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
					<LogOut className="size-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function PlayMainMenu({
	onPlay,
	skinKey,
	isSignedIn,
	bestScore,
	selectedDifficulty,
	onSelectDifficulty,
	selectedMods,
	onSelectMods,
	userName,
	userImage,
	isPending,
	onSignIn,
	onSignOut,
}: PlayMainMenuProps) {
	const multiplier = getScoreMultiplier(selectedMods);

	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden">
			{/* Gradient backdrop — lets game canvas show through */}
			<div className="absolute inset-0 bg-gradient-to-b from-[#091533]/80 via-[#091533]/60 to-[#091533]/80" />

			{/* Top-right auth pill */}
			<div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
				{isPending ? (
					<div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
				) : isSignedIn ? (
					<UserPill userName={userName} userImage={userImage} onSignOut={onSignOut} />
				) : (
					<button
						type="button"
						onClick={onSignIn}
						className="rounded-full border border-fang-cyan/60 px-4 py-1.5 text-sm font-semibold text-fang-cyan hover:bg-fang-cyan/10 transition-colors cursor-pointer"
					>
						Sign In
					</button>
				)}
			</div>

			<div className="relative z-10 flex flex-col items-center gap-2 sm:gap-4 lg:gap-6 text-center px-4 sm:px-6 max-w-sm sm:max-w-xl w-full h-full overflow-hidden justify-center py-6 sm:py-10">
				{/* Wolf skin */}
				<Image
					src={`/wolves/${skinKey}.png`}
					alt=""
					aria-hidden="true"
					priority
					width={80}
					height={80}
					className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 drop-shadow-[0_0_32px_rgba(15,172,237,0.5)] pixelated"
					unoptimized
				/>

				{/* Title */}
				<div>
					<h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white">
						FangDash
					</h1>
					<p className="text-xs font-semibold uppercase tracking-widest text-fang-cyan/60 mt-1">
						Endless Runner
					</p>
				</div>

				{/* Best score (signed-in only) */}
				{isSignedIn && (
					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
							Best
						</span>
						<span className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tabular-nums text-fang-cyan">
							{formatScoreDisplay(bestScore)}
						</span>
					</div>
				)}

				{/* Difficulty selector */}
				<div className="flex flex-col gap-1 sm:gap-2 w-full">
					<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
						Difficulty
					</span>
					<div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
						{DIFFICULTY_LEVELS.map((level) => {
							const isSelected = selectedDifficulty === level.name;
							return (
								<button
									type="button"
									key={level.name}
									onClick={() => onSelectDifficulty(level.name)}
									aria-pressed={isSelected}
									className={`relative rounded-lg border-l-[3px] px-2 py-1.5 sm:py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
										isSelected
											? "bg-white/10 border-white/20"
											: "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/15"
									}`}
									style={{
										borderLeftColor: level.color,
										boxShadow: isSelected ? `0 0 16px ${level.color}30` : undefined,
									}}
								>
									<span
										className="block text-xs font-bold uppercase tracking-wide"
										style={{ color: level.color }}
									>
										{level.label}
									</span>
									<div className="mt-0.5 hidden sm:flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono text-white/40">
										<span>{level.speedMultiplier}x</span>
										<span className="text-white/20">|</span>
										<span>{level.maxObstaclesOnScreen} obs</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Mod selector */}
				<div className="flex flex-col gap-1 sm:gap-2 w-full">
					<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
						Mods
					</span>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 w-full">
						{MOD_DEFINITIONS.map((mod) => {
							const isActive = (selectedMods & mod.flag) !== 0;
							return (
								<button
									type="button"
									key={mod.id}
									onClick={() => onSelectMods(selectedMods ^ mod.flag)}
									aria-pressed={isActive}
									className={`relative rounded-lg border px-2 py-1.5 sm:py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
										isActive
											? "bg-fang-purple/15 border-fang-purple/40"
											: "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/15"
									}`}
									style={{
										boxShadow: isActive ? "var(--glow-purple)" : undefined,
									}}
								>
									<div className="flex items-center gap-1.5 overflow-hidden">
										<span className="text-sm sm:text-base">{mod.icon}</span>
										<span
											className={`text-xs font-bold uppercase tracking-wide truncate ${
												isActive ? "text-fang-purple" : "text-white/60"
											}`}
										>
											{mod.name}
										</span>
										{!mod.ready && (
											<span className="rounded px-1 py-0.5 text-[8px] font-bold uppercase bg-fang-gold/20 text-fang-gold">
												Beta
											</span>
										)}
										<span
											className={`ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
												isActive
													? "bg-fang-purple/20 text-fang-purple"
													: "bg-white/10 text-white/50"
											}`}
										>
											{mod.multiplier}x
										</span>
									</div>
									<p className="mt-1 text-[10px] text-white/50 leading-tight hidden sm:block">
										{mod.description}
									</p>
									{!mod.ready && isActive && (
										<span className="mt-1 block text-[10px] font-medium leading-tight text-fang-gold">
											Unranked — won't count on the leaderboard
										</span>
									)}
								</button>
							);
						})}
					</div>
					{selectedMods > 0 && (
						<div className="text-center text-xs font-mono text-fang-purple">
							Score: {multiplier}x
						</div>
					)}
				</div>

				{/* PLAY button */}
				<button
					type="button"
					onClick={onPlay}
					className="w-full rounded-full bg-fang-cyan py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg font-extrabold uppercase tracking-widest text-[#091533] shadow-[0_0_32px_rgba(15,172,237,0.4)] hover:bg-fang-cyan/90 transition-all hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
				>
					PLAY
				</button>

				{/* Nav links */}
				<div className="flex gap-6 text-xs font-semibold uppercase tracking-widest text-white/60">
					<Link
						href="/leaderboard"
						className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan"
					>
						Leaderboard
					</Link>
					<Link
						href="/skins"
						className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fang-cyan"
					>
						Skins
					</Link>
				</div>

				<p className="text-[10px] font-mono uppercase tracking-widest text-white/50">
					Space or tap to jump
				</p>
			</div>
		</div>
	);
}
