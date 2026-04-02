"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signInWithTwitch } from "@/lib/auth-client.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
	unable_to_create_user: "We couldn't create your account. Please try again.",
	user_already_exists: "An account with this email already exists.",
	oauth_code_verifier_missing: "Your login session expired. Please try again.",
};

function AuthErrorContent() {
	const searchParams = useSearchParams();
	const code = searchParams.get("error") ?? "unknown";
	const message = ERROR_MESSAGES[code] ?? "Authentication failed. Please try again.";

	const handleTryAgain = () => {
		signInWithTwitch();
	};

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
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
				<div className="relative h-32 w-32">
					<Image
						src="/wolves/wolf-mrdemonwolf.png"
						alt="Error wolf"
						fill={true}
						className="object-contain drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]"
						style={{ imageRendering: "pixelated" }}
					/>
				</div>

				<Badge variant="destructive" className="font-mono">
					{code}
				</Badge>

				<h1 className="font-mono text-4xl font-bold tracking-widest text-foreground sm:text-5xl">
					LOGIN FAILED
				</h1>

				<p className="max-w-sm text-base text-muted-foreground">{message}</p>

				<div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
					<Button variant="glow" size="lg" onClick={handleTryAgain}>
						TRY AGAIN
					</Button>
					<Link
						href="/"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						← Back to Home
					</Link>
				</div>
			</div>
		</main>
	);
}

export default function AuthErrorPage() {
	return (
		<Suspense>
			<AuthErrorContent />
		</Suspense>
	);
}
