"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "@/lib/auth-client.ts";
import { Button } from "@/components/ui/button";

function TwitchIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
		</svg>
	);
}

export function HeroCTA() {
	const { data: session, isPending: sessionPending } = useSession();
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => setHasMounted(true), []);
	const isPending = !hasMounted || sessionPending;

	const handleSignIn = () => {
		signIn.social({ provider: "twitch", callbackURL: window.location.origin });
	};

	return (
		<div className="flex items-center gap-3 pt-2">
			<Button size="lg" asChild>
				<Link href="/play">Play Now</Link>
			</Button>
			{!isPending && !session && (
				<Button size="lg" variant="secondary" onClick={handleSignIn}>
					<TwitchIcon className="size-4" />
					Login with Twitch
				</Button>
			)}
		</div>
	);
}
