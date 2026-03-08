"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { getSkinById, ACHIEVEMENTS } from "@fangdash/shared";
import { ProfileSkeleton } from "./_skeleton";

/* ------------------------------------------------------------------ */
/*  Helper: format distance as km                                      */
/* ------------------------------------------------------------------ */

function fmtKm(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

/* ------------------------------------------------------------------ */
/*  Header Banner                                                      */
/* ------------------------------------------------------------------ */

function ProfileHeader({
  userName,
  userImage,
  skinSpriteKey,
  skinName,
  highScore,
  gamesPlayed,
}: {
  userName: string;
  userImage: string | null | undefined;
  skinSpriteKey: string | null;
  skinName: string | null;
  highScore: number;
  gamesPlayed: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,172,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(15,172,237,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        {/* Wolf sprite */}
        <div className="shrink-0">
          {skinSpriteKey ? (
            <div className="relative h-32 w-32">
              <Image
                src={`/wolves/${skinSpriteKey}.png`}
                alt={skinName ?? "Wolf"}
                fill
                className="object-contain drop-shadow-[0_0_40px_rgba(15,172,237,0.5)]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#0FACED]/20 bg-[#0FACED]/5 text-6xl">
              🐺
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{userName}</h1>
            <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
              {userImage && (
                <Image
                  src={userImage}
                  alt={userName}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-400">@{userName.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {skinName && (
              <p className="mt-1 text-xs text-[#0FACED]/70">
                Equipped: {skinName}
              </p>
            )}
          </div>

          {/* Right-side badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <div className="rounded-full border border-[#0FACED]/30 bg-[#0FACED]/10 px-3 py-1">
              <span className="font-mono text-sm font-bold text-[#0FACED]">
                HI {highScore.toLocaleString()}
              </span>
            </div>
            <div className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1">
              <span className="font-mono text-sm font-bold text-purple-400">
                {gamesPlayed} RUNS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Performance Matrix                                                 */
/* ------------------------------------------------------------------ */

interface MetricTile {
  label: string;
  value: string;
  accent: string;
}

function PerformanceMatrix({ tiles }: { tiles: MetricTile[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Performance Matrix
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/5 p-px">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-white/5 bg-[#0a1628] p-4 transition-all hover:border-[#0FACED]/30"
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
              {tile.label}
            </p>
            <p className={`font-mono text-2xl font-bold ${tile.accent}`}>
              {tile.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Honor Badges                                                       */
/* ------------------------------------------------------------------ */

interface Badge {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
}

function HonorBadges({
  badges,
  unlockedCount,
  totalCount,
}: {
  badges: Badge[];
  unlockedCount: number;
  totalCount: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Honor Badges
        </h2>
        <span className="font-mono text-xs text-[#0FACED]">
          {unlockedCount} / {totalCount}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 p-5">
        {badges.map((badge, i) => (
          <div
            key={i}
            title={`${badge.name}: ${badge.description}`}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
              badge.unlocked
                ? "border-[#0FACED]/40 bg-[#0FACED]/10 shadow-[0_0_12px_rgba(15,172,237,0.2)]"
                : "border-white/10 bg-white/5 grayscale opacity-40"
            }`}
          >
            <span className="text-2xl" role="img" aria-label={badge.name}>
              {badge.unlocked ? badge.icon : "🔒"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Scorelines                                                  */
/* ------------------------------------------------------------------ */

interface ScoreEntry {
  id: string;
  score: number;
  distance: number;
  obstaclesCleared: number;
  createdAt: string | Date;
}

function TrendArrow({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up")
    return <span className="font-mono text-xl font-bold text-emerald-400">↑</span>;
  if (trend === "down")
    return <span className="font-mono text-xl font-bold text-red-400">↓</span>;
  return <span className="font-mono text-xl font-bold text-gray-500">—</span>;
}

function RecentScorelines({ scores }: { scores: ScoreEntry[] }) {
  const top8 = scores.slice(0, 8);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Recent Scorelines
        </h2>
      </div>

      {top8.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">
          No scores yet. Play a game!
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {top8.map((entry, i) => {
            const next = top8[i + 1];
            const trend: "up" | "down" | "same" =
              next === undefined
                ? "same"
                : entry.score > next.score
                  ? "up"
                  : entry.score < next.score
                    ? "down"
                    : "same";

            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/5"
              >
                <TrendArrow trend={trend} />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-mono font-bold text-white">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {fmtKm(entry.distance)} ·{" "}
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {entry.obstaclesCleared > 0 && (
                  <span className="rounded-full bg-orange-400/10 px-2 py-0.5 font-mono text-xs text-orange-400">
                    {entry.obstaclesCleared}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();

  const isSignedIn = !!session?.user;

  const { data: scores, isPending: scoresLoading } = useQuery(
    trpc.score.myScores.queryOptions(undefined, { enabled: isSignedIn }),
  );

  const { data: equippedSkin, isPending: skinLoading } = useQuery(
    trpc.skin.getEquippedSkin.queryOptions(undefined, { enabled: isSignedIn }),
  );

  const { data: achievements, isPending: achievementsLoading } = useQuery(
    trpc.achievement.getMine.queryOptions(undefined, { enabled: isSignedIn }),
  );

  const { data: playerStats, isPending: playerStatsLoading } = useQuery(
    trpc.score.getPlayerStats.queryOptions(undefined, { enabled: isSignedIn }),
  );

  const { data: raceStats, isPending: raceStatsLoading } = useQuery(
    trpc.race.getStats.queryOptions(undefined, { enabled: isSignedIn }),
  );

  const isDataLoading =
    scoresLoading ||
    skinLoading ||
    achievementsLoading ||
    raceStatsLoading ||
    playerStatsLoading;

  /* ---- Redirect unauthenticated users ---- */
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace("/");
    }
  }, [sessionLoading, session, router]);

  /* ---- Skeleton while session or data queries are pending ---- */
  if (sessionLoading || (isSignedIn && isDataLoading)) {
    return <ProfileSkeleton />;
  }

  if (!session?.user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-400">Sign in to view your profile.</p>
      </main>
    );
  }

  const user = session.user;

  /* ---- Derived values ---- */
  const skinDef = equippedSkin ? getSkinById(equippedSkin.skinId) : null;

  const highScore =
    scores && scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

  const gamesPlayed = playerStats?.gamesPlayed ?? 0;
  const totalDistance = playerStats?.totalDistance ?? 0;
  const totalObstacles = playerStats?.totalObstaclesCleared ?? 0;
  const totalScore = playerStats?.totalScore ?? 0;

  const racesPlayed = raceStats?.racesPlayed ?? 0;
  const racesWon = raceStats?.racesWon ?? 0;
  const winRate =
    racesPlayed > 0
      ? ((racesWon / racesPlayed) * 100).toFixed(0) + "%"
      : "N/A";

  /* ---- Performance tiles ---- */
  const performanceTiles: MetricTile[] = [
    {
      label: "Total Distance",
      value: isDataLoading ? "—" : fmtKm(totalDistance),
      accent: "text-[#0FACED]",
    },
    {
      label: "High Score",
      value: isDataLoading ? "—" : highScore.toLocaleString(),
      accent: "text-[#0FACED]",
    },
    {
      label: "Win Rate",
      value: isDataLoading ? "—" : winRate,
      accent: "text-emerald-400",
    },
    {
      label: "Obstacles",
      value: isDataLoading ? "—" : totalObstacles.toLocaleString(),
      accent: "text-orange-400",
    },
    {
      label: "Games Played",
      value: isDataLoading ? "—" : gamesPlayed.toLocaleString(),
      accent: "text-purple-400",
    },
    {
      label: "Total Score",
      value: isDataLoading ? "—" : totalScore.toLocaleString(),
      accent: "text-yellow-400",
    },
  ];

  /* ---- Honor Badges ---- */
  const unlockedIds = new Set((achievements ?? []).map((a) => a?.id));
  const sortedUnlocked = [...(achievements ?? [])]
    .filter(Boolean)
    .sort((a, b) => {
      const aT = a?.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const bT = b?.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return bT - aT;
    });
  const unlockedByIdMap = new Map(sortedUnlocked.map((a) => [a!.id, a]));

  // Build up to 12 badges: unlocked first (most recent), then locked
  const BADGE_LIMIT = 12;
  const unlockedBadges: Badge[] = sortedUnlocked.slice(0, BADGE_LIMIT).map(
    (a) => ({
      icon: a!.icon,
      name: a!.name,
      description: a!.description ?? "",
      unlocked: true,
    }),
  );

  const lockedDefs = ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));
  const lockedBadges: Badge[] = lockedDefs
    .slice(0, Math.max(0, BADGE_LIMIT - unlockedBadges.length))
    .map((a) => ({
      icon: a.icon,
      name: a.name,
      description: a.description,
      unlocked: false,
    }));

  const allBadges = [...unlockedBadges, ...lockedBadges];

  // Suppress unused warning while map is constructed above
  void unlockedByIdMap;

  /* ---- Scores for scorelines ---- */
  const recentScores = (scores ?? []) as ScoreEntry[];

  /* ---------------------------------------------------------------- */
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        {/* Header banner */}
        <ProfileHeader
          userName={user.name ?? "Unknown"}
          userImage={user.image}
          skinSpriteKey={skinDef?.spriteKey ?? null}
          skinName={skinDef?.name ?? null}
          highScore={highScore}
          gamesPlayed={gamesPlayed}
        />

        {/* Main two-column grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Performance Matrix + Honor Badges */}
          <div className="space-y-6">
            <PerformanceMatrix tiles={performanceTiles} />
            <HonorBadges
              badges={allBadges}
              unlockedCount={sortedUnlocked.length}
              totalCount={ACHIEVEMENTS.length}
            />
          </div>

          {/* Right: Recent Scorelines (sticky on large screens) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <RecentScorelines scores={recentScores} />
          </div>
        </div>
      </div>
    </main>
  );
}

