export default function OfflinePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
				<div className="mb-4 text-5xl" aria-hidden="true">
					🐺
				</div>
				<h1 className="mb-2 text-2xl font-bold text-foreground">You&apos;re Offline</h1>
				<p className="mb-6 text-sm text-muted-foreground">
					FangDash needs an internet connection to load. Check your connection and try again.
				</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
				>
					Retry
				</button>
			</div>
		</main>
	);
}
