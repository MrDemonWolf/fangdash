// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function LeaderboardLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-[#091533] px-4 pt-24">
			<div className="w-full max-w-2xl space-y-4">
				<div className="h-10 w-48 animate-pulse rounded-lg bg-white/10" />
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
						key={i}
						className="flex items-center gap-4 rounded-lg bg-white/5 p-4"
					>
						<div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
						<div className="h-5 w-40 animate-pulse rounded bg-white/10" />
						<div className="ml-auto h-5 w-20 animate-pulse rounded bg-white/10" />
					</div>
				))}
			</div>
		</main>
	);
}
