"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/auth-client.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function generateRoomCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

function RoomCodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	return (
		<fieldset className="border-0 p-0 m-0">
			<legend className="sr-only">Enter 6-character room code</legend>
			<div className="flex justify-center gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<input
						key={i}
						type="text"
						maxLength={1}
						value={value[i] ?? ""}
						aria-label={`Room code digit ${i + 1} of 6`}
						className="h-14 w-12 rounded-lg border border-primary/20 bg-muted/50 text-center text-xl font-bold uppercase text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
						onChange={(e) => {
							const char = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
							if (!char) {
								const next = value.slice(0, i) + value.slice(i + 1);
								onChange(next);
								return;
							}
							const next = value.slice(0, i) + char + value.slice(i + 1);
							onChange(next.slice(0, 6));
							if (char && i < 5) {
								const nextInput = e.target.parentElement?.children[i + 1] as
									| HTMLInputElement
									| undefined;
								nextInput?.focus();
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace" && !value[i] && i > 0) {
								const prevInput = (e.target as HTMLElement).parentElement?.children[i - 1] as
									| HTMLInputElement
									| undefined;
								prevInput?.focus();
							}
						}}
						onPaste={(e) => {
							e.preventDefault();
							const pasted = e.clipboardData
								.getData("text")
								.toUpperCase()
								.replace(/[^A-Z0-9]/g, "")
								.slice(0, 6);
							onChange(pasted);
							const target = (e.target as HTMLElement).parentElement?.children[
								Math.min(pasted.length, 5)
							] as HTMLInputElement | undefined;
							target?.focus();
						}}
					/>
				))}
			</div>
		</fieldset>
	);
}

export default function RaceLobbyPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const isSignedIn = !!session?.user;
	const [roomCode, setRoomCode] = useState("");

	const handleCreate = () => {
		const code = generateRoomCode();
		router.push(`/race/${code}`);
	};

	const handleJoin = () => {
		if (roomCode.length === 6) {
			router.push(`/race/${roomCode.toUpperCase()}`);
		}
	};

	if (!isSignedIn) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
				<Card className="w-full max-w-md border-primary/20 text-center shadow-2xl">
					<CardContent className="p-8">
						<h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground">
							Race Mode
						</h1>
						<p className="mb-6 text-muted-foreground">Sign in to race against other players.</p>
						<Button variant="secondary" asChild>
							<Link href="/">Back to Home</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">Race Mode</h1>
					<p className="text-muted-foreground">Challenge other players to a head-to-head race.</p>
				</div>

				<Card className="border-primary/20">
					<CardContent className="p-6">
						<h2 className="mb-3 text-lg font-semibold text-foreground">Create a Room</h2>
						<p className="mb-4 text-sm text-muted-foreground">
							Start a new race room and share the code with friends.
						</p>
						<Button className="w-full uppercase tracking-wider" onClick={handleCreate}>
							Create Room
						</Button>
					</CardContent>
				</Card>

				<Card className="border-primary/20">
					<CardContent className="p-6">
						<h2 className="mb-3 text-lg font-semibold text-foreground">Join a Room</h2>
						<p className="mb-4 text-sm text-muted-foreground">
							Enter a 6-character room code to join an existing race.
						</p>
						<div className="mb-4">
							<RoomCodeInput value={roomCode} onChange={setRoomCode} />
						</div>
						<Button
							className="w-full uppercase tracking-wider"
							onClick={handleJoin}
							disabled={roomCode.length < 6}
						>
							Join Room
						</Button>
					</CardContent>
				</Card>

				<div className="text-center">
					<Link
						href="/"
						className="text-sm text-muted-foreground/60 transition-colors hover:text-muted-foreground"
					>
						Back to Home
					</Link>
				</div>
			</div>
		</main>
	);
}
