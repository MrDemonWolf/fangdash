export default function PlayLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-4xl space-y-6">
				<div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
				<div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
				<div className="flex justify-center gap-4">
					<div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
					<div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
				</div>
			</div>
		</main>
	);
}
