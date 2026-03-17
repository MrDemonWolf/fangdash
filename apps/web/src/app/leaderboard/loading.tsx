export default function LeaderboardLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24">
			<div className="w-full max-w-2xl space-y-4">
				<div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
						<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
						<div className="h-5 w-40 animate-pulse rounded bg-muted" />
						<div className="ml-auto h-5 w-20 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		</main>
	);
}
