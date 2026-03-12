"use client";
import { DIFFICULTY_LEVELS } from "@fangdash/shared";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PlayMainMenuProps {
	onPlay: () => void;
	skinKey: string;
	isSignedIn: boolean;
	bestScore: number;
	selectedDifficulty: string;
	onSelectDifficulty: (d: string) => void;
	userName?: string;
	userImage?: string;
	isPending?: boolean;
	onSignIn: () => void;
	onSignOut: () => void;
}

function UserPill({
	userName,
	userImage,
	onSignOut,
}: {
	userName?: string;
	userImage?: string;
	onSignOut: () => void;
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleOutsideClick = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		if (dropdownOpen) {
			document.addEventListener("mousedown", handleOutsideClick);
		}
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [dropdownOpen]);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setDropdownOpen((prev) => !prev)}
				className="flex items-center gap-2 bg-[#0a1628]/80 border border-white/10 backdrop-blur-xl rounded-full px-3 py-1.5 hover:border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
			>
				{userImage && (
					// biome-ignore lint/performance/noImgElement: game canvas context
					<img
						src={userImage}
						alt={userName ?? "User avatar"}
						className="h-6 w-6 rounded-full border border-[#0FACED]/50"
					/>
				)}
				<span className="text-sm font-medium text-gray-200">{userName}</span>
			</button>

			{dropdownOpen && (
				<div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/10 bg-[#0a1628]/90 backdrop-blur-xl shadow-xl overflow-hidden">
					<Link
						href="/profile"
						onClick={() => setDropdownOpen(false)}
						className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
					>
						<User className="h-4 w-4" />
						Profile
					</Link>
					<div className="h-px bg-white/10" />
					<button
						type="button"
						onClick={() => {
							setDropdownOpen(false);
							onSignOut();
						}}
						className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
					>
						<LogOut className="h-4 w-4" />
						Sign Out
					</button>
				</div>
			)}
		</div>
	);
}

export function PlayMainMenu({
	onPlay,
	skinKey,
	isSignedIn,
	bestScore,
	selectedDifficulty,
	onSelectDifficulty,
	userName,
	userImage,
	isPending,
	onSignIn,
	onSignOut,
}: PlayMainMenuProps) {
	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
			{/* Gradient backdrop — lets game canvas show through */}
			<div className="absolute inset-0 bg-gradient-to-b from-[#091533]/80 via-[#091533]/60 to-[#091533]/80" />

			{/* Top-right auth pill */}
			<div className="absolute top-4 right-4 z-30">
				{isPending ? (
					<div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
				) : isSignedIn ? (
					<UserPill
						userName={userName}
						userImage={userImage}
						onSignOut={onSignOut}
					/>
				) : (
					<button
						type="button"
						onClick={onSignIn}
						className="rounded-full border border-[#0FACED]/60 px-4 py-1.5 text-sm font-semibold text-[#0FACED] hover:bg-[#0FACED]/10 transition-colors cursor-pointer"
					>
						Sign In
					</button>
				)}
			</div>

			<div className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-sm w-full">
				{/* Wolf skin */}
				{/* biome-ignore lint/performance/noImgElement: game canvas context */}
				<img
					src={`/wolves/${skinKey}.png`}
					alt=""
					aria-hidden="true"
					width={80}
					height={80}
					className="drop-shadow-[0_0_32px_rgba(15,172,237,0.5)]"
					style={{ imageRendering: "pixelated" }}
				/>

				{/* Title */}
				<div>
					<h1 className="text-5xl font-extrabold uppercase tracking-tight text-white">
						FangDash
					</h1>
					<p className="text-xs font-semibold uppercase tracking-widest text-[#0FACED]/60 mt-1">
						Endless Runner
					</p>
				</div>

				{/* Best score (signed-in only) */}
				{isSignedIn && (
					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
							Best
						</span>
						<span className="text-2xl font-bold font-mono tabular-nums text-[#0FACED]">
							{String(bestScore).padStart(7, "0")}
						</span>
					</div>
				)}

				{/* Difficulty selector */}
				<div className="flex flex-col gap-2 w-full">
					<span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
						Difficulty
					</span>
					<div className="flex gap-1.5 flex-wrap justify-center">
						{DIFFICULTY_LEVELS.map((level) => (
							<button
								type="button"
								key={level.name}
								onClick={() => onSelectDifficulty(level.name)}
								className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
									selectedDifficulty === level.name
										? "bg-[#0FACED] text-[#091533]"
										: "border border-white/20 text-white/50 hover:border-white/40 hover:text-white"
								}`}
							>
								{level.name}
							</button>
						))}
					</div>
				</div>

				{/* PLAY button */}
				<button
					type="button"
					onClick={onPlay}
					className="w-full rounded-full bg-[#0FACED] py-4 text-lg font-extrabold uppercase tracking-widest text-[#091533] shadow-[0_0_32px_rgba(15,172,237,0.4)] hover:bg-[#0FACED]/90 transition-all hover:scale-105 active:scale-95 cursor-pointer"
				>
					PLAY
				</button>

				{/* Nav links */}
				<div className="flex gap-6 text-xs font-semibold uppercase tracking-widest text-white/40">
					<Link
						href="/leaderboard"
						className="hover:text-white transition-colors"
					>
						Leaderboard
					</Link>
					<Link href="/skins" className="hover:text-white transition-colors">
						Skins
					</Link>
				</div>

				<p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
					Space or tap to jump
				</p>
			</div>
		</div>
	);
}
