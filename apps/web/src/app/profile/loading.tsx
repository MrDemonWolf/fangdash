export default function ProfileLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#091533] px-4 pt-24">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-lg bg-white/5"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
