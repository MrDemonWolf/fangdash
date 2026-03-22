"use client";

import type { SkinDefinition, SkinRarity, SkinUnlockCondition } from "@fangdash/shared";
import { SKINS } from "@fangdash/shared";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Rarity colour map                                                  */
/* ------------------------------------------------------------------ */
const RARITY_STYLES: Record<SkinRarity, { badge: string; border: string; glow: string }> = {
	common: {
		badge: "secondary",
		border: "border-muted-foreground/30",
		glow: "",
	},
	uncommon: {
		badge: "emerald",
		border: "border-emerald-500/40",
		glow: "",
	},
	rare: {
		badge: "default",
		border: "border-primary/40",
		glow: "shadow-[var(--glow-cyan)]",
	},
	epic: {
		badge: "purple",
		border: "border-purple-500/40",
		glow: "shadow-[var(--glow-purple)]",
	},
	legendary: {
		badge: "gold",
		border: "border-yellow-500/40",
		glow: "shadow-[var(--glow-gold)]",
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
	unlockPercent,
}: {
	skin: GallerySkin;
	equipped: boolean;
	unlockPercent?: number | null;
}) {
	const rarity = RARITY_STYLES[skin.rarity];

	return (
		<Card
			className={cn(
				"fang-accent relative flex flex-col items-center p-4 transition-all border-2",
				equipped
					? "border-primary shadow-[var(--glow-cyan)]"
					: skin.unlocked
						? cn(rarity.border, rarity.glow)
						: "border-border opacity-70",
			)}
		>
			{equipped && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Equipped</Badge>}

			<div className="relative mb-3 mt-2 h-24 w-24">
				<Image
					src={`/wolves/${skin.spriteKey}.png`}
					alt={skin.name}
					fill={true}
					className={cn("pixelated object-contain", !skin.unlocked && "grayscale opacity-40")}
					sizes="96px"
				/>
				{!skin.unlocked && (
					<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
						<Lock className="size-8 text-muted-foreground drop-shadow-lg" />
					</div>
				)}
			</div>

			<h3 className="text-center text-lg font-bold text-foreground">{skin.name}</h3>

			<Badge
				variant={rarity.badge as "default" | "secondary" | "emerald" | "purple" | "gold"}
				className="mt-1 uppercase tracking-wider"
			>
				{skin.rarity}
			</Badge>

			<p className="mt-2 text-center text-sm text-muted-foreground">{skin.description}</p>

			<div className="mt-auto pt-4">
				{skin.unlocked ? (
					equipped ? (
						<span className="text-sm font-medium text-fang-cyan text-glow-cyan">
							Currently Equipped
						</span>
					) : (
						<span className="text-sm font-medium text-emerald-400">Unlocked</span>
					)
				) : (
					<p className="font-mono text-xs text-muted-foreground italic">
						{unlockConditionText(skin.unlockCondition)}
					</p>
				)}
				{unlockPercent != null && (
					<p className="mt-1 text-xs text-muted-foreground">
						{unlockPercent.toFixed(1)}% of players
					</p>
				)}
			</div>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SkinsPage() {
	const { data: session } = useSession();
	const signedIn = !!session?.user;

	const trpc = useTRPC();

	const galleryQuery = useQuery({
		...trpc.skin.gallery.queryOptions(),
		enabled: signedIn,
	});

	const equippedQuery = useQuery({
		...trpc.skin.getEquippedSkin.queryOptions(),
		enabled: signedIn,
	});

	const equippedSkinId = equippedQuery.data?.skinId ?? "gray-wolf";

	const skins: GallerySkin[] = signedIn
		? (galleryQuery.data ?? [])
		: SKINS.map((s) => ({
				...s,
				unlocked: s.unlockCondition.type === "default",
			}));

	const { data: skinStats } = useQuery(trpc.skin.getStats.queryOptions());

	const isLoading = signedIn && (galleryQuery.isLoading || equippedQuery.isLoading);

	return (
		<main className="mx-auto min-h-screen max-w-6xl px-4 py-12">
			{/* ── Page title with fang decorative lines ── */}
			<div className="mb-2 flex items-center justify-center gap-4">
				<span className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-fang-cyan/60" />
				<h1 className="text-center text-4xl font-extrabold text-glow-cyan text-fang-cyan">
					Skins Gallery
				</h1>
				<span className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-fang-cyan/60" />
			</div>
			<p className="mb-4 text-center text-muted-foreground">
				Collect wolf skins by playing the game
			</p>
			{signedIn && (
				<p className="mb-10 text-center">
					<Link href="/settings" className="text-sm text-fang-cyan hover:underline">
						Go to Settings to change your equipped skin
					</Link>
				</p>
			)}

			{!signedIn && (
				<Card className="mb-8 border-primary/30 bg-primary/5">
					<CardContent className="p-4 text-center">
						<p className="text-sm text-primary">Sign in to track progress and equip skins</p>
					</CardContent>
				</Card>
			)}

			{isLoading && (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-72 rounded-2xl" />
					))}
				</div>
			)}

			{!isLoading && (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{skins.map((skin) => (
						<SkinCard
							key={skin.id}
							skin={skin}
							equipped={signedIn && equippedSkinId === skin.id}
							unlockPercent={(() => {
								const stat = skinStats?.[skin.id];
								if (!stat || stat.totalPlayers === 0) return null;
								return (stat.unlockCount / stat.totalPlayers) * 100;
							})()}
						/>
					))}
				</div>
			)}
		</main>
	);
}
