export default function AchievementsLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#091533] px-4 pt-24">
      <div className="w-full max-w-3xl space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl bg-white/5 p-6"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-white/10" />
              <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
