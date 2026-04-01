import { Skeleton } from "@/components/ui/skeleton";

export default function ChangelogLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24 pb-16">
			<div className="w-full max-w-2xl space-y-8">
				<div className="space-y-2">
					<Skeleton className="h-9 w-48 rounded-lg" />
					<Skeleton className="h-4 w-72 rounded" />
				</div>
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-40 rounded" />
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>
						<Skeleton className="h-4 w-24 rounded" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-5/6 rounded" />
							<Skeleton className="h-4 w-4/6 rounded" />
						</div>
					</div>
				))}
			</div>
		</main>
	);
}
