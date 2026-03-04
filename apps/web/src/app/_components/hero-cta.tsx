"use client";

import Link from "next/link";
import { useSession, signIn } from "@/lib/auth-client";

export function HeroCTA() {
  const { data: session } = useSession();

  const handleSignIn = () => {
    signIn.social({ provider: "twitch", callbackURL: window.location.origin });
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Link
        href="/play"
        className="inline-flex items-center justify-center rounded-lg bg-[#0FACED] px-8 py-4 text-lg font-bold text-[#091533] transition-transform hover:scale-105 hover:shadow-[0_0_24px_rgba(15,172,237,0.4)]"
      >
        Play Now
      </Link>
      {!session && (
        <button
          onClick={handleSignIn}
          className="inline-flex items-center justify-center rounded-lg border border-[#0FACED]/40 px-6 py-3 text-sm font-medium text-[#0FACED] transition-colors hover:bg-[#0FACED]/10 cursor-pointer"
        >
          Sign In to Save Progress
        </button>
      )}
    </div>
  );
}
