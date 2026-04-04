"use client";

import { LogOut, Menu, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signInWithTwitch, signOut, useSession } from "@/lib/auth-client.ts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/ui/NotificationBell.tsx";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function TwitchIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
		</svg>
	);
}

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

	const isActive = (href: string) => pathname === href;

	const handleSignIn = () => {
		signInWithTwitch();
	};

	if (pathname === "/play") {
		return null;
	}

	return (
		<>
			<header
				className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
				style={{
					borderImage:
						"linear-gradient(90deg, transparent, oklch(0.72 0.15 210 / 0.15), oklch(0.48 0.18 300 / 0.1), transparent) 1",
				}}
			>
				<nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground transition-colors hover:text-primary"
					>
						<Image
							src="/wolves/wolf-mrdemonwolf.png"
							alt=""
							width={32}
							height={32}
							className="pixelated drop-shadow-[0_0_8px_rgba(15,172,237,0.3)]"
							aria-hidden="true"
						/>
						<span className="hidden sm:inline">FangDash</span>
					</Link>

					{/* Desktop nav links */}
					<div className="hidden md:flex items-center gap-1">
						{NAV_LINKS.map(({ href, label }) => (
							<Link
								key={href}
								href={href}
								aria-current={isActive(href) ? "page" : undefined}
								className={cn(
									"relative px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md",
									isActive(href)
										? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-primary after:shadow-[var(--glow-cyan)]"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{label}
							</Link>
						))}
					</div>

					{/* Desktop auth section */}
					<div className="hidden md:flex items-center gap-3">
						{isPending ? (
							<Skeleton className="h-8 w-24 rounded-full" />
						) : session?.user ? (
							<>
								<NotificationBell />
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-border/50 hover:border-primary/30 hover:bg-secondary transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											{session.user.image && (
												<img
													src={session.user.image}
													alt={session.user.name ?? "User avatar"}
													className="h-5 w-5 rounded-full"
												/>
											)}
											<span className="text-[13px] font-medium text-foreground">
												{session.user.name}
											</span>
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem asChild>
											<Link href="/profile" className="cursor-pointer">
												<User className="size-4" />
												Profile
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
											<LogOut className="size-4" />
											Sign Out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignIn}
								className="h-8 text-[13px]"
							>
								<TwitchIcon className="size-3.5" />
								Login with Twitch
							</Button>
						)}
					</div>

					{/* Mobile hamburger */}
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden size-8"
								aria-label="Open menu"
							>
								<Menu className="size-4" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-72 p-0">
							<SheetTitle className="sr-only">Navigation menu</SheetTitle>
							<div className="flex flex-col h-full">
								<div className="space-y-0.5 px-4 py-6">
									{NAV_LINKS.map(({ href, label }) => (
										<Link
											key={href}
											href={href}
											aria-current={isActive(href) ? "page" : undefined}
											onClick={() => setMobileOpen(false)}
											className={cn(
												"block rounded-md px-3 py-2 text-sm font-medium transition-colors",
												isActive(href)
													? "text-foreground bg-secondary"
													: "text-muted-foreground hover:text-foreground hover:bg-secondary",
											)}
										>
											{label}
										</Link>
									))}
								</div>

								<Separator />

								<div className="px-4 py-4 mt-auto">
									{isPending ? (
										<Skeleton className="h-10 w-full rounded-lg" />
									) : session?.user ? (
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2.5">
												{session.user.image && (
													<img
														src={session.user.image}
														alt={session.user.name ?? "User avatar"}
														className="h-7 w-7 rounded-full"
													/>
												)}
												<span className="text-sm font-medium text-foreground">
													{session.user.name}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<NotificationBell />
												<Button variant="ghost" size="icon" className="size-8" asChild>
													<Link href="/profile" aria-label="Profile">
														<User className="size-3.5" />
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													onClick={() => signOut()}
													aria-label="Sign out"
												>
													<LogOut className="size-3.5" />
												</Button>
											</div>
										</div>
									) : (
										<Button variant="outline" className="w-full" onClick={handleSignIn}>
											<TwitchIcon className="size-4" />
											Login with Twitch
										</Button>
									)}
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</nav>
			</header>
			<div className="h-14" aria-hidden="true" />
		</>
	);
}
