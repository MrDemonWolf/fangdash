"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/race", label: "Race" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/skins", label: "Skins" },
  { href: "/achievements", label: "Achievements" },
  { href: "/profile", label: "Profile" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const handleSignIn = () => {
    signIn.social({ provider: "twitch", callbackURL: window.location.origin });
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#091533] border-b border-white/10 shadow-lg shadow-black/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-wide text-white hover:text-[#0FACED] transition-colors"
          >
            <span className="text-[#0FACED] text-2xl" aria-hidden="true">
              🐺
            </span>
            FangDash
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "text-[#0FACED] bg-[#0FACED]/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth section */}
          <div className="hidden md:flex items-center gap-3">
            {isPending ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-white/10" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    className="h-8 w-8 rounded-full border border-[#0FACED]/50"
                  />
                )}
                <span className="text-sm font-medium text-gray-200">
                  {session.user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="rounded-md bg-[#0FACED] px-4 py-2 text-sm font-semibold text-[#091533] hover:bg-[#0FACED]/80 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#091533]">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive(href)
                    ? "text-[#0FACED] bg-[#0FACED]/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile auth */}
          <div className="border-t border-white/10 px-4 py-3">
            {isPending ? (
              <div className="h-10 animate-pulse rounded-md bg-white/10" />
            ) : session?.user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User avatar"}
                      className="h-8 w-8 rounded-full border border-[#0FACED]/50"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-200">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full rounded-md bg-[#0FACED] px-4 py-2 text-sm font-semibold text-[#091533] hover:bg-[#0FACED]/80 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
