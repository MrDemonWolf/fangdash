import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				{/* Header skeleton */}
				<Skeleton className="h-32 w-full rounded-2xl" />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					<div className="space-y-6">
						{/* Performance Matrix skeleton */}
						<Card>
							<CardHeader>
								<Skeleton className="h-4 w-40" />
							</CardHeader>
							<div className="grid grid-cols-2 gap-2 p-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={i} className="h-24 rounded-xl" />
								))}
							</div>
						</Card>
						{/* Honor Badges skeleton */}
						<Card>
							<CardContent className="p-5">
								<Skeleton className="mb-4 h-4 w-32" />
								<div className="flex flex-wrap gap-3">
									{Array.from({ length: 12 }).map((_, i) => (
										<Skeleton key={i} className="size-12 rounded-full" />
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Scorelines skeleton */}
					<Card>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<div className="space-y-2 p-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<Skeleton key={i} className="h-10 rounded-lg" />
							))}
						</div>
					</Card>
				</div>
			</div>
		</main>
	);
}
