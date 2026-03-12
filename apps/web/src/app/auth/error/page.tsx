"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "@/lib/auth-client.ts";

const ERROR_MESSAGES: Record<string, string> = {
	unable_to_create_user: "We couldn't create your account. Please try again.",
	user_already_exists: "An account with this email already exists.",
	oauth_code_verifier_missing: "Your login session expired. Please try again.",
};

function AuthErrorContent() {
	const searchParams = useSearchParams();
	const code = searchParams.get("error") ?? "unknown";
	const message =
		ERROR_MESSAGES[code] ?? "Authentication failed. Please try again.";

	const handleTryAgain = () => {
		signIn.social({ provider: "twitch", callbackURL: window.location.origin });
	};

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#091533] px-4 text-center">
			{/* Grid overlay */}
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				aria-hidden="true"
				style={{
					backgroundImage:
						"linear-gradient(rgba(239,68,68,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.4) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			{/* Scan-line overlay */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.03]"
				aria-hidden="true"
				style={{
					backgroundImage:
						"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)",
				}}
			/>

			<div className="relative z-10 flex flex-col items-center gap-6">
				{/* Wolf sprite with red glow */}
				<div className="relative h-32 w-32">
					<Image
						src="/wolves/wolf-mrdemonwolf.png"
						alt="Error wolf"
						fill={true}
						className="object-contain drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]"
						style={{ imageRendering: "pixelated" }}
					/>
				</div>

				{/* Error code badge */}
				<span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-xs text-red-400">
					{code}
				</span>

				{/* Headline */}
				<h1 className="font-mono text-4xl font-bold tracking-widest text-white sm:text-5xl">
					LOGIN FAILED
				</h1>

				{/* Human-readable message */}
				<p className="max-w-sm text-base text-gray-400">{message}</p>

				{/* CTAs */}
				<div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
					<button
						type="button"
						onClick={handleTryAgain}
						className="rounded-lg bg-[#0FACED] px-8 py-3 font-bold text-[#091533] transition-transform hover:scale-105 hover:shadow-[0_0_24px_rgba(15,172,237,0.4)] cursor-pointer"
					>
						TRY AGAIN
					</button>
					<Link
						href="/"
						className="text-sm text-gray-500 transition-colors hover:text-gray-300"
					>
						← Back to Home
					</Link>
				</div>
			</div>
		</main>
	);
}

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function AuthErrorPage() {
	return (
		<Suspense>
			<AuthErrorContent />
		</Suspense>
	);
}
