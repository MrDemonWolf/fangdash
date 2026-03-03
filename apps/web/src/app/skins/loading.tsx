export default function SkinsLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#091533] px-4 pt-24">
      <div className="w-full max-w-3xl space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl bg-white/5 p-4"
            >
              <div className="aspect-square w-full animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
