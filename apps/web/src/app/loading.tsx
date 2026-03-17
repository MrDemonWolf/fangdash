export default function Loading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background">
			<div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
			<p className="mt-4 animate-pulse text-muted-foreground">Loading...</p>
		</main>
	);
}
