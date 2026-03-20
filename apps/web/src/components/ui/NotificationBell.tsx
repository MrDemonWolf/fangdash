"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications.ts";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_ICONS: Record<string, string> = {
	achievement: "🏆",
	skin: "🎨",
	level_up: "⬆️",
	score_synced: "☁️",
	score_submitted: "✅",
};

function formatRelativeTime(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function NotificationBell() {
	const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

	return (
		<DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markAllRead()}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="relative flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
					aria-label={
						unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"
					}
				>
					<Bell className="size-4" />
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				{notifications.length === 0 ? (
					<div className="px-4 py-6 text-center text-sm text-muted-foreground">
						No notifications
					</div>
				) : (
					<>
						<div className="max-h-80 overflow-y-auto">
							{notifications.map((notification) => (
								<DropdownMenuItem
									key={notification.id}
									className={cn(
										"flex items-start gap-2.5 px-3 py-2.5 cursor-default",
										!notification.read && "bg-accent/50",
									)}
								>
									<span className="mt-0.5 text-base leading-none shrink-0">
										{notification.icon ?? TYPE_ICONS[notification.type] ?? "🔔"}
									</span>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground truncate">
											{notification.title}
										</p>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{notification.description}
										</p>
										<p className="mt-0.5 text-[10px] text-muted-foreground/60">
											{formatRelativeTime(notification.createdAt)}
										</p>
									</div>
								</DropdownMenuItem>
							))}
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={clearAll}
							className="justify-center text-xs text-muted-foreground cursor-pointer"
						>
							Clear all
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
