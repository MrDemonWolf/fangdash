"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useSession, signIn, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/race", label: "Race" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/skins", label: "Skins" },
  { href: "/achievements", label: "Achievements" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href;

  const handleSignIn = () => {
    signIn.social({ provider: "twitch", callbackURL: window.location.origin });
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    signOut();
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  // Hide navbar and spacer entirely on the play page
  if (pathname === '/play') return null;

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 pointer-events-none">
      <nav className="pointer-events-auto mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/5">
        <div className="flex h-14 items-center justify-between px-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-wide text-white hover:text-[#0FACED] transition-colors"
          >
            <Image
              src="/wolves/wolf-mrdemonwolf.png"
              alt=""
              width={24}
              height={24}
              style={{ imageRendering: "pixelated" }}
              aria-hidden="true"
            />
            FangDash
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative px-3 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
                  isActive(href)
                    ? "text-[#0FACED] after:absolute after:bottom-0 after:inset-x-2 after:h-0.5 after:bg-[#0FACED] after:rounded-full"
                    : "text-gray-400 hover:text-white"
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User avatar"}
                      className="h-6 w-6 rounded-full border border-[#0FACED]/50"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-200">
                    {session.user.name}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#0a1628]/90 backdrop-blur-xl shadow-xl overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <div className="h-px bg-white/10" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="rounded-full border border-[#0FACED]/60 px-4 py-1.5 text-sm font-semibold text-[#0FACED] hover:bg-[#0FACED]/10 transition-colors cursor-pointer"
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden backdrop-blur-xl bg-[#0a1628]/90 rounded-xl mt-2 mx-2 mb-2 border border-white/10 overflow-hidden">
            <div className="space-y-0.5 px-3 py-2">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
                    isActive(href)
                      ? "text-[#0FACED] bg-[#0FACED]/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-white/10 px-3 py-3">
              {isPending ? (
                <div className="h-10 animate-pulse rounded-md bg-white/10" />
              ) : session?.user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
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
                  <div className="flex items-center gap-1">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Profile"
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); handleSignOut(); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="w-full rounded-full border border-[#0FACED]/60 px-4 py-2 text-sm font-semibold text-[#0FACED] hover:bg-[#0FACED]/10 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
    <div className="h-20" aria-hidden="true" />
    </>
  );
}
