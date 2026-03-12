import Link from "next/link";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<h1 className="text-8xl font-bold text-[var(--color-fang-orange)]">
				404
			</h1>
			<h2 className="mt-4 text-3xl font-semibold text-[#0FACED]">
				Lost in the forest...
			</h2>
			<p className="mt-4 max-w-md text-lg text-gray-400">
				This trail has gone cold. The pack moved on, and there&apos;s nothing
				left but moonlight and shadows.
			</p>
			<Link
				href="/"
				className="mt-8 inline-block rounded-lg bg-[#0FACED] px-6 py-3 font-semibold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
			>
				Return to the Den
			</Link>
		</main>
	);
}
