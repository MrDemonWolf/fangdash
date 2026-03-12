"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      const role = session?.user?.role;
      if (!role || (role !== "admin" && role !== "dev")) {
        router.replace("/");
      }
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0FACED] border-t-transparent" />
      </main>
    );
  }

  const role = session?.user?.role;
  if (!role || (role !== "admin" && role !== "dev")) {
    return null;
  }

  const navLinks = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/players", label: "Players" },
    { href: "/admin/scores", label: "Scores" },
    { href: "/admin/races", label: "Races" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-400">
          Logged in as <span className="text-[#0FACED]">{session.user.name}</span>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
            role === "admin" ? "bg-orange-500/20 text-orange-400" : "bg-purple-500/20 text-purple-400"
          }`}>{role}</span>
        </p>
      </div>

      {/* Sub-nav */}
      <nav className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-[#0a1628]/60 p-1 backdrop-blur-xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0FACED]/20 text-[#0FACED]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
