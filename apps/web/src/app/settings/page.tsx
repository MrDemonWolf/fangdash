"use client";

import type { SkinDefinition, SkinRarity } from "@fangdash/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client.ts";
import { useTRPC } from "@/lib/trpc.ts";

/* ------------------------------------------------------------------ */
/*  Rarity colour map                                                  */
/* ------------------------------------------------------------------ */
const RARITY_COLORS: Record<SkinRarity, { badge: string; border: string }> = {
	common: { badge: "bg-gray-600", border: "border-gray-500" },
	uncommon: { badge: "bg-green-700", border: "border-green-500" },
	rare: { badge: "bg-blue-700", border: "border-blue-500" },
	epic: { badge: "bg-purple-700", border: "border-purple-500" },
	legendary: { badge: "bg-yellow-700", border: "border-yellow-500" },
};

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 backdrop-blur-xl">
			<div className="border-b border-white/10 px-5 py-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
					{title}
				</h2>
			</div>
			<div className="p-5">{children}</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Inline status message                                              */
/* ------------------------------------------------------------------ */
function StatusMessage({
	type,
	message,
}: {
	type: "success" | "error";
	message: string;
}) {
	return (
		<p
			className={`mt-2 text-sm ${
				type === "success" ? "text-emerald-400" : "text-red-400"
			}`}
		>
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
	const rarity = RARITY_COLORS[skin.rarity];

	return (
		<button
			type="button"
			onClick={() => {
				if (skin.unlocked && !equipped) onEquip(skin.id);
			}}
			disabled={!skin.unlocked || equipped || isEquipping}
			className={`relative flex flex-col items-center rounded-xl border-2 p-3 transition-all ${
				equipped
					? "border-[#0FACED] shadow-[0_0_20px_rgba(15,172,237,0.4)]"
					: skin.unlocked
						? `${rarity.border} hover:border-[#0FACED]/60 cursor-pointer`
						: "border-gray-700 opacity-50 cursor-not-allowed"
			} bg-[#091533]`}
		>
			{equipped && (
				<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0FACED] px-2 py-0.5 text-[10px] font-bold text-[#091533]">
					Equipped
				</span>
			)}

			<div className="relative mb-2 mt-1 h-16 w-16">
				<Image
					src={`/wolves/${skin.spriteKey}.png`}
					alt={skin.name}
					fill={true}
					className={`object-contain ${skin.unlocked ? "" : "grayscale"}`}
					sizes="64px"
				/>
				{!skin.unlocked && (
					<div className="absolute inset-0 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 text-gray-400"
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

			<p className="text-center text-xs font-bold text-white">{skin.name}</p>
			<span
				className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${rarity.badge}`}
			>
				{skin.rarity}
			</span>
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  Delete confirmation modal                                          */
/* ------------------------------------------------------------------ */
function DeleteConfirmationModal({
	onConfirm,
	onCancel,
	isPending,
}: {
	onConfirm: () => void;
	onCancel: () => void;
	isPending: boolean;
}) {
	const [confirmText, setConfirmText] = useState("");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="mx-4 w-full max-w-md rounded-2xl border border-red-500/30 bg-[#091533] p-6">
				<h3 className="text-lg font-bold text-red-400">Delete Account</h3>
				<p className="mt-2 text-sm text-gray-300">
					This action is irreversible. Your account, scores, achievements, and
					all associated data will be permanently deleted after a grace period.
				</p>
				<p className="mt-3 text-sm text-gray-400">
					Type <span className="font-mono font-bold text-red-400">DELETE</span>{" "}
					to confirm:
				</p>
				<input
					type="text"
					value={confirmText}
					onChange={(e) => setConfirmText(e.target.value)}
					placeholder="DELETE"
					className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50"
				/>
				<div className="mt-4 flex gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={isPending}
						className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={confirmText !== "DELETE" || isPending}
						className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isPending ? "Deleting..." : "Delete My Account"}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
function SettingsSkeleton() {
	return (
		<main className="mx-auto min-h-screen max-w-4xl px-4 py-12">
			<div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-white/10" />
			<div className="space-y-6">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#0a1628]/60"
					/>
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

	/* ---- State ---- */
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

	/* ---- Redirect unauthenticated users ---- */
	useEffect(() => {
		if (!(sessionLoading || session?.user)) {
			router.replace("/");
		}
	}, [sessionLoading, session, router]);

	/* ---- Queries ---- */
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

	/* ---- Mutations ---- */
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

	/* ---- Handlers ---- */
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

	/* ---- Loading / auth guard ---- */
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
				<p className="text-lg text-gray-400">Sign in to access settings.</p>
			</main>
		);
	}

	const user = session.user;
	const equippedSkinId = equippedQuery.data?.skinId ?? "gray-wolf";
	const skins: GallerySkin[] = galleryQuery.data ?? [];
	const profilePublic = privacyQuery.data?.profilePublic ?? true;
	const accountStatus = accountStatusQuery.data;
	const deletionPending = accountStatus?.deletionPending ?? false;

	/* ---------------------------------------------------------------- */
	return (
		<main className="mx-auto min-h-screen max-w-4xl px-4 py-12">
			<h1 className="mb-2 text-3xl font-extrabold text-white">Settings</h1>
			<p className="mb-8 text-gray-400">Manage your profile, privacy, and account</p>

			<div className="space-y-6">
				{/* ============================================================ */}
				{/*  PROFILE SECTION                                              */}
				{/* ============================================================ */}
				<Section title="Profile">
					{/* User info */}
					<div className="mb-6 flex items-center gap-4">
						{user.image && (
							<Image
								src={user.image}
								alt={user.name ?? "Avatar"}
								width={56}
								height={56}
								className="rounded-full border-2 border-white/10"
							/>
						)}
						<div>
							<p className="text-lg font-bold text-white">{user.name ?? "Unknown"}</p>
							<p className="text-sm text-gray-400">
								Display name and avatar are managed through Twitch
							</p>
						</div>
					</div>

					{/* Skin picker */}
					<div>
						<h3 className="mb-3 text-sm font-semibold text-gray-300">Equipped Skin</h3>
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
							<p className="text-sm text-gray-500">No skins available.</p>
						)}
					</div>
				</Section>

				{/* ============================================================ */}
				{/*  PRIVACY SECTION                                              */}
				{/* ============================================================ */}
				<Section title="Privacy">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-semibold text-white">
								Allow others to view my profile
							</p>
							<p className="mt-0.5 text-xs text-gray-400">
								When disabled, your profile page will not be visible to other
								players
							</p>
						</div>
						<button
							type="button"
							onClick={handleTogglePrivacy}
							disabled={privacyMutation.isPending}
							className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
								profilePublic ? "bg-[#0FACED]" : "bg-gray-600"
							}`}
							role="switch"
							aria-checked={profilePublic}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
									profilePublic ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>
					{privacyStatus && (
						<StatusMessage
							type={privacyStatus.type}
							message={privacyStatus.message}
						/>
					)}
				</Section>

				{/* ============================================================ */}
				{/*  ACCOUNT SECTION                                              */}
				{/* ============================================================ */}
				<Section title="Account">
					{deletionPending ? (
						<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
							<p className="text-sm font-semibold text-red-400">
								Account deletion pending
							</p>
							{accountStatus?.deletionScheduledFor && (
								<p className="mt-1 text-xs text-gray-400">
									Scheduled for deletion on{" "}
									{new Date(
										accountStatus.deletionScheduledFor,
									).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							)}
							{accountStatus?.deletionRequestedAt && (
								<p className="mt-0.5 text-xs text-gray-500">
									Requested on{" "}
									{new Date(
										accountStatus.deletionRequestedAt,
									).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							)}
							<button
								type="button"
								onClick={handleCancelDeletion}
								disabled={cancelDeletionMutation.isPending}
								className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
							>
								{cancelDeletionMutation.isPending
									? "Cancelling..."
									: "Cancel Deletion"}
							</button>
						</div>
					) : (
						<div>
							<p className="text-sm text-gray-300">
								Permanently delete your account and all associated data including
								scores, achievements, skins, and race history.
							</p>
							<button
								type="button"
								onClick={() => setShowDeleteModal(true)}
								className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20"
							>
								Delete My Account
							</button>
						</div>
					)}
					{deleteStatus && (
						<StatusMessage
							type={deleteStatus.type}
							message={deleteStatus.message}
						/>
					)}
				</Section>
			</div>

			{/* Delete confirmation modal */}
			{showDeleteModal && (
				<DeleteConfirmationModal
					onConfirm={handleRequestDeletion}
					onCancel={() => setShowDeleteModal(false)}
					isPending={deletionMutation.isPending}
				/>
			)}
		</main>
	);
}
