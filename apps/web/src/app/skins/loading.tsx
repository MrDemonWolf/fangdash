import { Skeleton } from "@/components/ui/skeleton";

export default function SkinsLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24">
			<div className="w-full max-w-3xl space-y-6">
				<Skeleton className="h-10 w-40 rounded-lg" />
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="space-y-3 rounded-xl bg-muted/50 p-4">
							<Skeleton className="aspect-square w-full rounded-lg" />
							<Skeleton className="h-4 w-20 rounded" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
