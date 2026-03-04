"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { SKINS } from "@fangdash/shared";
import type { SkinDefinition, SkinRarity, SkinUnlockCondition } from "@fangdash/shared";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Rarity colour map                                                  */
/* ------------------------------------------------------------------ */
const RARITY_COLORS: Record<SkinRarity, { badge: string; border: string; text: string }> = {
  common: {
    badge: "bg-gray-600",
    border: "border-gray-500",
    text: "text-gray-300",
  },
  uncommon: {
    badge: "bg-green-700",
    border: "border-green-500",
    text: "text-green-400",
  },
  rare: {
    badge: "bg-blue-700",
    border: "border-blue-500",
    text: "text-blue-400",
  },
  epic: {
    badge: "bg-purple-700",
    border: "border-purple-500",
    text: "text-purple-400",
  },
  legendary: {
    badge: "bg-yellow-700",
    border: "border-yellow-500",
    text: "text-yellow-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function unlockConditionText(condition: SkinUnlockCondition): string {
  switch (condition.type) {
    case "default":
      return "Unlocked by default";
    case "score":
      return `Score ${condition.threshold.toLocaleString()} points`;
    case "distance":
      return `Run ${condition.threshold.toLocaleString()} metres`;
    case "games_played":
      return `Play ${condition.count.toLocaleString()} games`;
    case "achievement":
      return `Unlock achievement: ${condition.achievementId}`;
  }
}

/* ------------------------------------------------------------------ */
/*  SkinCard                                                           */
/* ------------------------------------------------------------------ */
interface GallerySkin extends SkinDefinition {
  unlocked: boolean;
}

function SkinCard({
  skin,
  equipped,
  onEquip,
  isEquipping,
  signedIn,
  equipError,
}: {
  skin: GallerySkin;
  equipped: boolean;
  onEquip: (skinId: string) => void;
  isEquipping: boolean;
  signedIn: boolean;
  equipError?: boolean;
}) {
  const rarity = RARITY_COLORS[skin.rarity];

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
        equipped
          ? "border-[#0FACED] shadow-[0_0_20px_rgba(15,172,237,0.4)]"
          : skin.unlocked
            ? rarity.border
            : "border-gray-700 opacity-75"
      } bg-[#091533]`}
    >
      {/* Equipped indicator */}
      {equipped && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0FACED] px-3 py-0.5 text-xs font-bold text-[#091533]">
          Equipped
        </span>
      )}

      {/* Sprite preview */}
      <div className="relative mb-3 mt-2 h-24 w-24">
        <Image
          src={`/wolves/${skin.spriteKey}.png`}
          alt={skin.name}
          fill
          className={`object-contain ${!skin.unlocked ? "grayscale" : ""}`}
          sizes="96px"
        />
        {!skin.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-center text-lg font-bold text-white">{skin.name}</h3>

      {/* Rarity badge */}
      <span
        className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-white ${rarity.badge}`}
      >
        {skin.rarity}
      </span>

      {/* Description */}
      <p className="mt-2 text-center text-sm text-gray-400">{skin.description}</p>

      {/* Unlock condition or equip button */}
      <div className="mt-auto pt-4">
        {skin.unlocked ? (
          signedIn && !equipped ? (
            <>
              {equipError && (
                <p className="mb-2 text-center text-xs text-red-400">Failed to equip skin. Please try again.</p>
              )}
              <button
                onClick={() => onEquip(skin.id)}
                disabled={isEquipping}
                className="rounded-lg bg-[#0FACED] px-5 py-2 text-sm font-bold text-[#091533] transition-colors hover:bg-[#0FACED]/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEquipping ? "Equipping..." : "Equip"}
              </button>
            </>
          ) : equipped ? (
            <span className="text-sm font-medium text-[#0FACED]">Currently Equipped</span>
          ) : null
        ) : (
          <p className="text-center text-xs text-gray-500">
            {unlockConditionText(skin.unlockCondition)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SkinsPage() {
  const { data: session } = useSession();
  const signedIn = !!session?.user;

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  /* ---- Queries (only when signed in) ---- */
  const galleryQuery = useQuery({
    ...trpc.skin.gallery.queryOptions(),
    enabled: signedIn,
  });

  const equippedQuery = useQuery({
    ...trpc.skin.getEquippedSkin.queryOptions(),
    enabled: signedIn,
  });

  /* ---- Equip mutation with optimistic update ---- */
  const equippedQueryKey = trpc.skin.getEquippedSkin.queryOptions().queryKey;

  const equipMutation = useMutation(trpc.skin.equipSkin.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equippedQueryKey });
    },
  }));

  function handleEquip(skinId: string) {
    // Optimistically update before the mutation fires
    const previousEquipped = queryClient.getQueryData<{ skinId: string }>(equippedQueryKey);
    queryClient.setQueryData(equippedQueryKey, { skinId });
    equipMutation.mutate(
      { skinId },
      {
        onError: () => {
          // Roll back on error
          if (previousEquipped) {
            queryClient.setQueryData(equippedQueryKey, previousEquipped);
          }
        },
      },
    );
  }

  /* ---- Derive display data ---- */
  const equippedSkinId = equippedQuery.data?.skinId ?? "gray-wolf";

  // When signed in, use gallery data; otherwise show all skins as locked (except default)
  const skins: GallerySkin[] = signedIn
    ? (galleryQuery.data ?? [])
    : SKINS.map((s) => ({
        ...s,
        unlocked: s.unlockCondition.type === "default",
      }));

  const isLoading = signedIn && (galleryQuery.isLoading || equippedQuery.isLoading);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-center text-4xl font-extrabold text-white">
        Skins Gallery
      </h1>
      <p className="mb-10 text-center text-gray-400">
        Collect and equip wolf skins by playing the game
      </p>

      {/* Sign-in notice */}
      {!signedIn && (
        <div className="mb-8 rounded-lg border border-[#0FACED]/30 bg-[#0FACED]/10 px-6 py-4 text-center">
          <p className="text-sm text-[#0FACED]">Sign in to track progress and equip skins</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-[#0FACED]" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              equipped={signedIn && equippedSkinId === skin.id}
              onEquip={handleEquip}
              isEquipping={equipMutation.isPending}
              signedIn={signedIn}
              equipError={equipMutation.isError}
            />
          ))}
        </div>
      )}
    </main>
  );
}
