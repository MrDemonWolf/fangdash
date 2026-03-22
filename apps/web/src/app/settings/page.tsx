"use client";

import type { SkinDefinition, SkinRarity } from "@fangdash/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

/* ------------------------------------------------------------------ */
/*  Rarity colour map                                                  */
/* ------------------------------------------------------------------ */
const RARITY_STYLES: Record<SkinRarity, { badge: string; border: string }> = {
	common: { badge: "secondary", border: "border-gray-500/30" },
	uncommon: { badge: "emerald", border: "border-emerald-500/30" },
	rare: { badge: "default", border: "border-primary/30" },
	epic: { badge: "purple", border: "border-purple-500/30" },
	legendary: { badge: "gold", border: "border-fang-gold/30" },
};

/* ------------------------------------------------------------------ */
/*  Status message                                                     */
/* ------------------------------------------------------------------ */
function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
	return (
		<p className={cn("mt-2 text-sm", type === "success" ? "text-emerald-400" : "text-destructive")}>
			{message}
		</p>
	);
}

/* ------------------------------------------------------------------ */
/*  Skin picker card                                                   */
/* ------------------------------------------------------------------ */
interface GallerySkin extends SkinDefinition {
	unlocked: boolean;
}

function SkinPickerCard({
	skin,
	equipped,
	onEquip,
	isEquipping,
}: {
	skin: GallerySkin;
	equipped: boolean;
	onEquip: (skinId: string) => void;
	isEquipping: boolean;
}) {
	const rarity = RARITY_STYLES[skin.rarity];

	return (
		<button
			type="button"
			onClick={() => {
				if (skin.unlocked && !equipped) onEquip(skin.id);
			}}
			disabled={!skin.unlocked || equipped || isEquipping}
			className={cn(
				"relative flex flex-col items-center rounded-xl border-2 p-3 transition-all bg-card/60 backdrop-blur-sm",
				equipped
					? "border-primary shadow-[var(--glow-cyan)]"
					: skin.unlocked
						? cn(
								rarity.border,
								"hover:border-primary/60 hover:shadow-[var(--glow-cyan)] cursor-pointer",
							)
						: "border-border grayscale opacity-60 cursor-not-allowed",
			)}
		>
			{equipped && (
				<Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 shadow-[var(--glow-cyan)]">
					Equipped
				</Badge>
			)}

			<div className="relative mb-2 mt-1 h-16 w-16">
				<Image
					src={`/wolves/${skin.spriteKey}.png`}
					alt={skin.name}
					fill={true}
					className={cn("object-contain", !skin.unlocked && "grayscale")}
					sizes="64px"
				/>
				{!skin.unlocked && (
					<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/40">
						<Lock className="size-6 text-muted-foreground" />
					</div>
				)}
			</div>

			<p className="text-center text-xs font-bold text-foreground">{skin.name}</p>
			<Badge
				variant={rarity.badge as "default" | "secondary" | "emerald" | "purple" | "gold"}
				className="mt-1 text-[10px] uppercase tracking-wider"
			>
				{skin.rarity}
			</Badge>
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  Delete confirmation dialog                                         */
/* ------------------------------------------------------------------ */
function DeleteConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending: boolean;
}) {
	const [confirmText, setConfirmText] = useState("");

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!v) setConfirmText("");
				onOpenChange(v);
			}}
		>
			<DialogContent className="border-destructive/30">
				<DialogHeader>
					<DialogTitle className="text-destructive">Delete Account</DialogTitle>
					<DialogDescription>
						This action is irreversible. Your account, scores, achievements, and all associated data
						will be permanently deleted after a grace period.
					</DialogDescription>
				</DialogHeader>
				<div className="p-6 pt-0">
					<p className="text-sm text-muted-foreground">
						Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:
					</p>
					<Input
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						placeholder="DELETE"
						className="mt-2"
					/>
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={confirmText !== "DELETE" || isPending}
					>
						{isPending ? "Deleting..." : "Delete My Account"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
function SettingsSkeleton() {
	return (
		<main className="mx-auto min-h-screen max-w-4xl px-4 py-16">
			<div className="mb-10 text-center">
				<Skeleton className="mx-auto mb-2 h-10 w-64" />
				<Skeleton className="mx-auto h-5 w-80" />
			</div>
			<div className="space-y-8">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-48 rounded-2xl" />
				))}
			</div>
		</main>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
	const router = useRouter();
	const { data: session, isPending: sessionLoading } = useSession();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const isSignedIn = !!session?.user;

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [equipStatus, setEquipStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [privacyStatus, setPrivacyStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [deleteStatus, setDeleteStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	useEffect(() => {
		if (!(sessionLoading || session?.user)) {
			router.replace("/");
		}
	}, [sessionLoading, session, router]);

	const galleryQuery = useQuery({
		...trpc.skin.gallery.queryOptions(),
		enabled: isSignedIn,
	});

	const equippedQuery = useQuery({
		...trpc.skin.getEquippedSkin.queryOptions(),
		enabled: isSignedIn,
	});

	const privacyQuery = useQuery({
		...trpc.account.getPrivacy.queryOptions(),
		enabled: isSignedIn,
	});

	const accountStatusQuery = useQuery({
		...trpc.account.getAccountStatus.queryOptions(),
		enabled: isSignedIn,
	});

	const equippedQueryKey = trpc.skin.getEquippedSkin.queryOptions().queryKey;

	const equipMutation = useMutation(
		trpc.skin.equipSkin.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: equippedQueryKey });
				setEquipStatus({ type: "success", message: "Skin equipped successfully." });
				setTimeout(() => setEquipStatus(null), 3000);
			},
			onError: () => {
				setEquipStatus({ type: "error", message: "Failed to equip skin. Please try again." });
			},
		}),
	);

	const privacyQueryKey = trpc.account.getPrivacy.queryOptions().queryKey;

	const privacyMutation = useMutation(
		trpc.account.updatePrivacy.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: privacyQueryKey });
				setPrivacyStatus({ type: "success", message: "Privacy settings updated." });
				setTimeout(() => setPrivacyStatus(null), 3000);
			},
			onError: () => {
				setPrivacyStatus({
					type: "error",
					message: "Failed to update privacy settings.",
				});
			},
		}),
	);

	const accountStatusQueryKey = trpc.account.getAccountStatus.queryOptions().queryKey;

	const deletionMutation = useMutation(
		trpc.account.requestDeletion.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: accountStatusQueryKey });
				setShowDeleteModal(false);
				setDeleteStatus({
					type: "success",
					message: "Account deletion requested. You can cancel this within the grace period.",
				});
			},
			onError: () => {
				setDeleteStatus({
					type: "error",
					message: "Failed to request account deletion. Please try again.",
				});
			},
		}),
	);

	const cancelDeletionMutation = useMutation(
		trpc.account.cancelDeletion.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: accountStatusQueryKey });
				setDeleteStatus({
					type: "success",
					message: "Account deletion cancelled.",
				});
				setTimeout(() => setDeleteStatus(null), 3000);
			},
			onError: () => {
				setDeleteStatus({
					type: "error",
					message: "Failed to cancel deletion. Please try again.",
				});
			},
		}),
	);

	function handleEquip(skinId: string) {
		setEquipStatus(null);
		const previousEquipped = queryClient.getQueryData<{ skinId: string }>(equippedQueryKey);
		queryClient.setQueryData(equippedQueryKey, { skinId });
		equipMutation.mutate(
			{ skinId },
			{
				onError: () => {
					if (previousEquipped) {
						queryClient.setQueryData(equippedQueryKey, previousEquipped);
					}
				},
			},
		);
	}

	function handleTogglePrivacy() {
		setPrivacyStatus(null);
		const current = privacyQuery.data?.profilePublic ?? true;
		privacyMutation.mutate({ profilePublic: !current });
	}

	function handleRequestDeletion() {
		setDeleteStatus(null);
		deletionMutation.mutate();
	}

	function handleCancelDeletion() {
		setDeleteStatus(null);
		cancelDeletionMutation.mutate();
	}

	const isDataLoading =
		galleryQuery.isLoading ||
		equippedQuery.isLoading ||
		privacyQuery.isLoading ||
		accountStatusQuery.isLoading;

	if (sessionLoading || (isSignedIn && isDataLoading)) {
		return <SettingsSkeleton />;
	}

	if (!session?.user) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center">
				<p className="text-lg text-muted-foreground">Sign in to access settings.</p>
			</main>
		);
	}

	const user = session.user;
	const equippedSkinId = equippedQuery.data?.skinId ?? "gray-wolf";
	const skins: GallerySkin[] = galleryQuery.data ?? [];
	const profilePublic = privacyQuery.data?.profilePublic ?? true;
	const accountStatus = accountStatusQuery.data;
	const deletionPending = accountStatus?.deletionPending ?? false;

	return (
		<main className="mx-auto min-h-screen max-w-4xl px-4 py-16">
			{/* Page Header */}
			<div className="mb-10 text-center">
				<h1 className="text-glow-cyan mb-2 text-3xl font-extrabold tracking-tight text-foreground">
					<span className="text-muted-foreground/40">{"\u2014\u27E8 "}</span>
					Settings
					<span className="text-muted-foreground/40">{" \u27E9\u2014"}</span>
				</h1>
				<p className="text-sm text-muted-foreground">Manage your profile, privacy, and account</p>
			</div>

			<div className="space-y-8">
				{/* Profile Section */}
				<Card className="fang-accent border-border/50">
					<CardHeader>
						<CardTitle className="text-fang-cyan">Profile</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-6 flex items-center gap-4">
							{user.image && (
								<Image
									src={user.image}
									alt={user.name ?? "Avatar"}
									width={56}
									height={56}
									className="rounded-full border-2 border-primary/40 shadow-[var(--glow-cyan)]"
								/>
							)}
							<div>
								<p className="text-lg font-bold text-foreground">{user.name ?? "Unknown"}</p>
								<p className="text-sm text-muted-foreground">
									Display name and avatar are managed through Twitch
								</p>
							</div>
						</div>

						<div>
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
								Equipped Skin
							</h3>
							{equipStatus && (
								<StatusMessage type={equipStatus.type} message={equipStatus.message} />
							)}
							<div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
								{skins.map((skin) => (
									<SkinPickerCard
										key={skin.id}
										skin={skin}
										equipped={equippedSkinId === skin.id}
										onEquip={handleEquip}
										isEquipping={equipMutation.isPending}
									/>
								))}
							</div>
							{skins.length === 0 && (
								<p className="text-sm text-muted-foreground">No skins available.</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Privacy Section */}
				<Card className="fang-accent border-border/50">
					<CardHeader>
						<CardTitle className="text-fang-cyan">Privacy</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
									Allow others to view my profile
								</p>
								<p className="mt-1 text-sm text-foreground">
									When disabled, your profile page will not be visible to other players
								</p>
							</div>
							<Switch
								checked={profilePublic}
								onCheckedChange={handleTogglePrivacy}
								disabled={privacyMutation.isPending}
							/>
						</div>
						{privacyStatus && (
							<StatusMessage type={privacyStatus.type} message={privacyStatus.message} />
						)}
					</CardContent>
				</Card>

				{/* Danger Zone */}
				<Card className="fang-accent border-destructive/20">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
					</CardHeader>
					<CardContent>
						{deletionPending ? (
							<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
								<p className="text-sm font-semibold text-destructive">Account deletion pending</p>
								{accountStatus?.deletionScheduledFor && (
									<p className="mt-1 text-xs text-muted-foreground">
										Scheduled for deletion on{" "}
										{new Date(accountStatus.deletionScheduledFor).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</p>
								)}
								{accountStatus?.deletionRequestedAt && (
									<p className="mt-0.5 text-xs text-muted-foreground/60">
										Requested on{" "}
										{new Date(accountStatus.deletionRequestedAt).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</p>
								)}
								<Button
									variant="secondary"
									size="sm"
									onClick={handleCancelDeletion}
									disabled={cancelDeletionMutation.isPending}
									className="mt-3"
								>
									{cancelDeletionMutation.isPending ? "Cancelling..." : "Cancel Deletion"}
								</Button>
							</div>
						) : (
							<div>
								<p className="text-sm text-muted-foreground">
									Permanently delete your account and all associated data including scores,
									achievements, skins, and race history.
								</p>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setShowDeleteModal(true)}
									className="mt-4 transition-shadow hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
								>
									Delete My Account
								</Button>
							</div>
						)}
						{deleteStatus && (
							<StatusMessage type={deleteStatus.type} message={deleteStatus.message} />
						)}
					</CardContent>
				</Card>
			</div>

			<DeleteConfirmationDialog
				open={showDeleteModal}
				onOpenChange={setShowDeleteModal}
				onConfirm={handleRequestDeletion}
				isPending={deletionMutation.isPending}
			/>
		</main>
	);
}
