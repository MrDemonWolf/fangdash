import { Skeleton } from "@/components/ui/skeleton";

export default function RaceLoading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-4xl space-y-6">
				<Skeleton className="h-10 w-56 rounded-lg" />
				<Skeleton className="aspect-video w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-lg" />
			</div>
		</main>
	);
}
