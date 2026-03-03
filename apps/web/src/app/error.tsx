"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4 text-center">
      <h1 className="text-6xl font-bold text-[#0FACED]">Oops!</h1>
      <p className="mt-4 text-xl text-white">Something went wrong.</p>
      <p className="mt-2 max-w-md text-white/50">
        An unexpected error occurred. You can try again or head back to the home
        page.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-[#0FACED] px-6 py-3 font-semibold text-[#091533] transition-colors hover:bg-[#0FACED]/80"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[#0FACED] px-6 py-3 font-semibold text-[#0FACED] transition-colors hover:bg-[#0FACED]/10"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
