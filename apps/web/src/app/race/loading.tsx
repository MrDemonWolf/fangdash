// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function RaceLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
			<div className="w-full max-w-4xl space-y-6">
				<div className="h-10 w-56 animate-pulse rounded-lg bg-white/10" />
				<div className="aspect-video w-full animate-pulse rounded-xl bg-white/10" />
				<div className="h-16 w-full animate-pulse rounded-lg bg-white/10" />
			</div>
		</main>
	);
}
