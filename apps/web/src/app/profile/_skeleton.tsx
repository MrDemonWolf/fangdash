export function ProfileSkeleton() {
	return (
		<main className="mx-auto max-w-5xl px-4 py-8">
			<div className="space-y-6">
				{/* Header skeleton */}
				<div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
					<div className="space-y-6">
						{/* Performance Matrix skeleton */}
						<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60">
							<div className="h-10 border-b border-white/10" />
							<div className="grid grid-cols-2 gap-2 p-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
										key={i}
										className="h-24 animate-pulse rounded-xl bg-white/5"
									/>
								))}
							</div>
						</div>
						{/* Honor Badges skeleton */}
						<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 p-5">
							<div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/5" />
							<div className="flex flex-wrap gap-3">
								{Array.from({ length: 12 }).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
										key={i}
										className="h-12 w-12 animate-pulse rounded-full bg-white/5"
									/>
								))}
							</div>
						</div>
					</div>

					{/* Scorelines skeleton */}
					<div className="rounded-2xl border border-white/10 bg-[#0a1628]/60">
						<div className="h-10 border-b border-white/10" />
						<div className="space-y-2 p-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
									key={i}
									className="h-10 animate-pulse rounded-lg bg-white/5"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
