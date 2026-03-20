import { useSyncExternalStore } from "react";
import {
	type Notification,
	addNotification,
	clearAll,
	getSnapshot,
	getUnreadCount,
	markAllRead,
	subscribe,
} from "@/lib/notification-store.ts";

const emptyArray: Notification[] = [];

function getServerSnapshot(): Notification[] {
	return emptyArray;
}

export function useNotifications() {
	const notifications = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const unreadCount = notifications.filter((n) => !n.read).length;

	return {
		notifications,
		unreadCount,
		addNotification,
		markAllRead,
		clearAll,
		getUnreadCount,
	};
}
