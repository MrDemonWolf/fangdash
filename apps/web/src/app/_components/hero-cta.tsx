"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "@/lib/auth-client.ts";

function TwitchIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
		</svg>
	);
}

export function HeroCTA() {
	const { data: session } = useSession();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSignIn = () => {
		signIn.social({ provider: "twitch", callbackURL: window.location.origin });
	};

	return (
		<div className="flex flex-col items-center gap-4 sm:flex-row">
			<Link
				href="/play"
				className="inline-flex items-center justify-center rounded-lg bg-[#0FACED] px-8 py-4 text-lg font-bold text-[#091533] transition-transform hover:scale-105 hover:shadow-[0_0_24px_rgba(15,172,237,0.4)]"
			>
				Play Now
			</Link>
			{mounted && !session && (
				<button
					type="button"
					onClick={handleSignIn}
					className="inline-flex items-center gap-2 rounded-lg border border-[#0FACED]/40 px-8 py-4 text-lg font-bold text-[#0FACED] transition-colors hover:bg-[#0FACED]/10 cursor-pointer"
				>
					<TwitchIcon className="h-4 w-4" />
					Login with Twitch
				</button>
			)}
		</div>
	);
}
