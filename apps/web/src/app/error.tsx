"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
	error: _error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<h1 className="text-6xl font-bold text-primary">Oops!</h1>
			<p className="mt-4 text-xl text-foreground">Something went wrong.</p>
			<p className="mt-2 max-w-md text-muted-foreground">
				An unexpected error occurred. You can try again or head back to the home page.
			</p>
			<div className="mt-8 flex gap-4">
				<Button onClick={reset}>Try Again</Button>
				<Button variant="outline" asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		</main>
	);
}
