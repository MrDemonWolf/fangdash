"use client";
import {
  DIFFICULTY_LEVELS,
  getScoreMultiplier,
  MOD_DEFINITIONS,
} from "@fangdash/shared";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
      {/* Gradient backdrop — lets game canvas show through */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091533]/80 via-[#091533]/60 to-[#091533]/80" />

      {/* Top-right auth pill */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
        {isPending
          ? <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
          : isSignedIn
          ? (
            <UserPill
              userName={userName}
              userImage={userImage}
              onSignOut={onSignOut}
            />
          )
          : (
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-full border border-[#0FACED]/60 px-4 py-1.5 text-sm font-semibold text-[#0FACED] hover:bg-[#0FACED]/10 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 text-center px-4 sm:px-6 max-w-sm w-full max-h-[90dvh] overflow-y-auto py-14 sm:py-6">
        {/* Wolf skin */}
        <img
          src={`/wolves/${skinKey}.png`}
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-[0_0_32px_rgba(15,172,237,0.5)]"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Title */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white">
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
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#0FACED]">
              {String(bestScore).padStart(7, "0")}
            </span>
          </div>
        )}

        {/* Difficulty selector */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Difficulty
          </span>
          <div className="grid grid-cols-2 gap-2 w-full sm:grid-cols-3">
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = selectedDifficulty === level.name;
              return (
                <button
                  type="button"
                  key={level.name}
                  onClick={() => onSelectDifficulty(level.name)}
                  aria-pressed={isSelected}
                  className={`relative rounded-lg border-l-[3px] px-2 sm:px-3 py-2 sm:py-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/15"
                  }`}
                  style={{
                    borderLeftColor: level.color,
                    boxShadow: isSelected
                      ? `0 0 16px ${level.color}30`
                      : undefined,
                  }}
                >
                  <span
                    className="block text-xs font-bold uppercase tracking-wide"
                    style={{ color: level.color }}
                  >
                    {level.label}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono text-white/40">
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
        <div className="flex flex-col gap-2 w-full">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Mods
          </span>
          <div className="grid grid-cols-2 gap-2 w-full">
            {MOD_DEFINITIONS.map((mod) => {
              const isActive = (selectedMods & mod.flag) !== 0;
              return (
                <button
                  type="button"
                  key={mod.id}
                  onClick={() => onSelectMods(selectedMods ^ mod.flag)}
                  aria-pressed={isActive}
                  className={`relative rounded-lg border px-2 sm:px-3 py-2 sm:py-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-purple-500/15 border-purple-500/40"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/15"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? "0 0 16px rgba(168, 85, 247, 0.2)"
                      : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-base">{mod.icon}</span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide truncate ${
                        isActive ? "text-purple-300" : "text-white/60"
                      }`}
                    >
                      {mod.name}
                    </span>
                    {!mod.ready && (
                      <span className="rounded px-1 py-0.5 text-[8px] font-bold uppercase bg-yellow-500/20 text-yellow-400">
                        Beta
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                        isActive
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {mod.multiplier}x
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/30 leading-tight">
                    {mod.description}
                    {!mod.ready && isActive && (
                      <span className="block mt-0.5 text-yellow-400/60">
                        Unranked — won't appear on leaderboard
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
          {selectedMods > 0 && (
            <div className="text-center text-xs font-mono text-purple-300">
              Score: {multiplier}x
            </div>
          )}
        </div>

        {/* PLAY button */}
        <button
          type="button"
          onClick={onPlay}
          className="w-full rounded-full bg-[#0FACED] py-3 sm:py-4 text-base sm:text-lg font-extrabold uppercase tracking-widest text-[#091533] shadow-[0_0_32px_rgba(15,172,237,0.4)] hover:bg-[#0FACED]/90 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
