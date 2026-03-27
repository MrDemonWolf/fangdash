"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import type { NotificationType } from "@/lib/notification-store.ts";
import { useNotifications } from "@/hooks/use-notifications.ts";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_CONFIG: Record<NotificationType, { dot: string; icon: string }> = {
	score: { dot: "bg-[#0FACED]", icon: "\u2601\ufe0f" },
	achievement: { dot: "bg-amber-400", icon: "\ud83c\udfc6" },
	skin: { dot: "bg-purple-400", icon: "\ud83c\udfa8" },
	level_up: { dot: "bg-emerald-400", icon: "\u2b06\ufe0f" },
};

function formatRelativeTime(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

export function NotificationBell() {
	const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

	return (
		<DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markAllRead()}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="relative flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
					aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
				>
					<Bell className="size-4" />
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-72 p-0"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
					<span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
						Activity
					</span>
					{notifications.length > 0 && (
						<button
							type="button"
							onClick={clearAll}
							className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
						>
							Clear
						</button>
					)}
				</div>

				{notifications.length === 0 ? (
					<div className="px-4 py-8 text-center text-xs text-muted-foreground/60">
						No activity yet this session
					</div>
				) : (
					<div className="relative px-4 py-2">
						{/* Timeline line */}
						<div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[#0FACED]/40 via-border/30 to-transparent" />

						{notifications.map((notification, i) => {
							const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.score;
							const isLast = i === notifications.length - 1;

							const content = (
								<div
									className={cn(
										"relative flex items-start gap-3 py-2 group",
										notification.href && "cursor-pointer",
									)}
								>
									{/* Dot */}
									<div className="relative z-10 mt-1 flex-shrink-0">
										<div
											className={cn(
												"size-[7px] rounded-full ring-[3px] ring-card",
												config.dot,
												!notification.read && "shadow-[0_0_6px_currentColor]",
											)}
										/>
									</div>

									{/* Content */}
									<div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-1")}>
										<div className="flex items-baseline justify-between gap-2">
											<p
												className={cn(
													"text-xs truncate",
													!notification.read
														? "font-semibold text-foreground"
														: "font-medium text-foreground/80",
												)}
											>
												<span className="mr-1.5">{config.icon}</span>
												{notification.title}
											</p>
											<span className="text-[10px] font-mono text-muted-foreground/40 flex-shrink-0 tabular-nums">
												{formatRelativeTime(notification.createdAt)}
											</span>
										</div>
										<p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
											{notification.description}
										</p>
									</div>
								</div>
							);

							if (notification.href) {
								return (
									<Link
										key={notification.id}
										href={notification.href}
										className="block hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
									>
										{content}
									</Link>
								);
							}

							return <div key={notification.id}>{content}</div>;
						})}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
