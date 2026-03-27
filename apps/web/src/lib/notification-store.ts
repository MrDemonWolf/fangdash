// ---------------------------------------------------------------------------
// Notification store — in-memory (session-only), last 5 FIFO
// ---------------------------------------------------------------------------

const MAX_NOTIFICATIONS = 5;

export type NotificationType = "achievement" | "skin" | "level_up" | "score";

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	description: string;
	icon?: string;
	href?: string;
	createdAt: number;
	read: boolean;
}

// ---------------------------------------------------------------------------
// Subscribers (useSyncExternalStore pattern)
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
	for (const fn of listeners) fn();
}

export function subscribe(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// In-memory store (session-only — clears on page reload)
// ---------------------------------------------------------------------------

let notifications: Notification[] = [];

function update(next: Notification[]) {
	notifications = next;
	emit();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getNotifications(): Notification[] {
	return notifications;
}

export function getSnapshot(): Notification[] {
	return notifications;
}

export function addNotification(
	notification: Omit<Notification, "id" | "createdAt" | "read">,
): void {
	const entry: Notification = {
		...notification,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
		read: false,
	};
	update([entry, ...notifications].slice(0, MAX_NOTIFICATIONS));
}

export function markAllRead(): void {
	update(notifications.map((n) => ({ ...n, read: true })));
}

export function clearAll(): void {
	update([]);
}

export function getUnreadCount(): number {
	return notifications.filter((n) => !n.read).length;
}
