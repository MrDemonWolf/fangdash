"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { getSkinById } from "@fangdash/shared";
import {
  Trophy,
  Gamepad2,
  Target,
  Swords,
  Award,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                   */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className ?? ""}`}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <SkeletonBlock className="mb-3 h-5 w-20" />
      <SkeletonBlock className="h-8 w-16" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-[#0FACED]/40">
      <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
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

  /* ---- tRPC queries (only enabled when authenticated) ---- */
  const isSignedIn = !!session?.user;

  const {
    data: scores,
    isPending: scoresLoading,
  } = useQuery(trpc.score.myScores.queryOptions(undefined, { enabled: isSignedIn }));

  const {
    data: equippedSkin,
    isPending: skinLoading,
  } = useQuery(trpc.skin.getEquippedSkin.queryOptions(undefined, { enabled: isSignedIn }));

  const {
    data: achievements,
    isPending: achievementsLoading,
  } = useQuery(trpc.achievement.getMine.queryOptions(undefined, { enabled: isSignedIn }));

  const {
    data: raceStats,
    isPending: raceStatsLoading,
  } = useQuery(trpc.race.getStats.queryOptions(undefined, { enabled: isSignedIn }));

  /* ---- Redirect unauthenticated users ---- */
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace("/");
    }
  }, [sessionLoading, session, router]);

  /* ---- Derived data ---- */
  const highScore =
    scores && scores.length > 0
      ? Math.max(...scores.map((s) => s.score))
      : 0;

  const gamesPlayed = scores?.length ?? 0;

  const recentScores = scores?.slice(0, 10) ?? [];

  const recentAchievements = achievements
    ? [...achievements]
        .sort((a, b) => {
          const aTime = a?.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const bTime = b?.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5)
    : [];

  const skinDef = equippedSkin ? getSkinById(equippedSkin.skinId) : null;

  /* ---- Loading / unauthenticated guard ---- */
  if (sessionLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <SkeletonBlock className="mb-6 h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-400">Sign in to view your profile.</p>
      </main>
    );
  }

  const user = session.user;
  const isDataLoading = scoresLoading || skinLoading || achievementsLoading || raceStatsLoading;

  /* ---------------------------------------------------------------- */
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* ── User Info ── */}
      <section className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#0FACED]/60">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#091533] text-3xl font-bold text-[#0FACED]">
              {(user.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-white">{user.name}</h1>
          <p className="mt-1 text-sm text-gray-400">{user.email}</p>

          {/* Equipped skin preview */}
          {skinLoading ? (
            <SkeletonBlock className="mt-3 h-16 w-16" />
          ) : skinDef ? (
            <div className="mt-3 flex items-center gap-2">
              <Image
                src={`/wolves/${skinDef.spriteKey}.png`}
                alt={skinDef.name}
                width={48}
                height={48}
                className="rounded"
              />
              <span className="text-sm text-[#0FACED]">{skinDef.name}</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Stats Grid ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Stats</h2>
        {isDataLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Gamepad2 size={16} />}
              label="Games Played"
              value={gamesPlayed}
            />
            <StatCard
              icon={<Trophy size={16} />}
              label="High Score"
              value={highScore.toLocaleString()}
            />
            <StatCard
              icon={<Swords size={16} />}
              label="Total Races"
              value={raceStats?.racesPlayed ?? 0}
            />
            <StatCard
              icon={<Target size={16} />}
              label="Total Wins"
              value={raceStats?.racesWon ?? 0}
            />
          </div>
        )}
      </section>

      {/* ── Recent Achievements ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Recent Achievements
          </h2>
          <Link
            href="/achievements"
            className="flex items-center gap-1 text-sm text-[#0FACED] hover:underline"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {achievementsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recentAchievements.length === 0 ? (
          <p className="text-sm text-gray-500">
            No achievements unlocked yet. Start playing to earn some!
          </p>
        ) : (
          <ul className="space-y-2">
            {recentAchievements.map((a) =>
              a ? (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-[#0FACED]/40"
                >
                  <span className="text-2xl" role="img" aria-label={a.name}>
                    {a.icon}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{a.name}</p>
                    {a.unlockedAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(a.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Award size={16} className="text-[#0FACED]" />
                </li>
              ) : null
            )}
          </ul>
        )}
      </section>

      {/* ── Recent Scores ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Scores</h2>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-sm text-[#0FACED] hover:underline"
          >
            Leaderboard <ChevronRight size={14} />
          </Link>
        </div>

        {scoresLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : recentScores.length === 0 ? (
          <p className="text-sm text-gray-500">
            No scores yet. Play a game to see your results here!
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Score
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Distance
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentScores.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {s.score.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {s.distance.toLocaleString()}m
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
