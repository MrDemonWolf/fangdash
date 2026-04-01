import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24">
			<div className="w-full max-w-3xl space-y-6">
				<Skeleton className="h-10 w-56 rounded-lg" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="space-y-3 rounded-xl bg-muted/50 p-6">
							<Skeleton className="h-10 w-10 rounded-lg" />
							<Skeleton className="h-5 w-32 rounded" />
							<Skeleton className="h-4 w-full rounded" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
