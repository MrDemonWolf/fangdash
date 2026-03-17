"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending) {
			const role = session?.user?.role;
			if (!role || role !== "admin") {
				router.replace("/");
			}
		}
	}, [isPending, session, router]);

	if (isPending) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</main>
		);
	}

	const role = session?.user?.role;
	if (!role || role !== "admin") {
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
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
				<p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
					Logged in as <span className="text-primary">{session.user.name}</span>
					<Badge variant={role === "admin" ? "orange" : "purple"}>{role}</Badge>
				</p>
			</div>

			<nav className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
				{navLinks.map((link) => {
					const isActive = pathname === link.href;
					return (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all",
								isActive
									? "bg-secondary text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
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
