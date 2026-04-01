import { Skeleton } from "@/components/ui/skeleton";

export default function PlayLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-4xl space-y-6">
				<Skeleton className="h-10 w-48 rounded-lg" />
				<Skeleton className="aspect-video w-full rounded-xl" />
				<div className="flex justify-center gap-4">
					<Skeleton className="h-12 w-32 rounded-lg" />
					<Skeleton className="h-12 w-32 rounded-lg" />
				</div>
			</div>
		</main>
	);
}
