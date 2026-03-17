import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<h1 className="text-8xl font-bold text-[var(--color-fang-orange)]">404</h1>
			<h2 className="mt-4 text-3xl font-semibold text-primary">Lost in the forest...</h2>
			<p className="mt-4 max-w-md text-lg text-muted-foreground">
				This trail has gone cold. The pack moved on, and there&apos;s nothing left but moonlight and
				shadows.
			</p>
			<Button className="mt-8" asChild>
				<Link href="/">Return to the Den</Link>
			</Button>
		</main>
	);
}
