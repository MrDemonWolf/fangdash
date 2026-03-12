// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function Loading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-[#091533]">
			<div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0FACED]/30 border-t-[#0FACED]" />
			<p className="mt-4 animate-pulse text-white/50">Loading...</p>
		</main>
	);
}
