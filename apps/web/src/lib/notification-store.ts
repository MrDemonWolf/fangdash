// ---------------------------------------------------------------------------
// Notification store — localStorage-backed, last 10 FIFO
// ---------------------------------------------------------------------------

const STORAGE_KEY = "fangdash-notifications";
const MAX_NOTIFICATIONS = 10;

export interface Notification {
	id: string;
	type: "achievement" | "skin" | "level_up" | "score_synced" | "score_submitted";
	title: string;
	description: string;
	icon?: string;
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
// Read / write helpers
// ---------------------------------------------------------------------------

function load(): Notification[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Notification[]) : [];
	} catch {
		return [];
	}
}

function save(notifications: Notification[]) {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
	emit();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getNotifications(): Notification[] {
	return load();
}

export function getSnapshot(): Notification[] {
	return load();
}

export function addNotification(
	notification: Omit<Notification, "id" | "createdAt" | "read">,
): void {
	const items = load();
	const entry: Notification = {
		...notification,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
		read: false,
	};
	items.unshift(entry);
	save(items.slice(0, MAX_NOTIFICATIONS));
}

export function markAllRead(): void {
	const items = load();
	save(items.map((n) => ({ ...n, read: true })));
}

export function clearAll(): void {
	save([]);
}

export function getUnreadCount(): number {
	return load().filter((n) => !n.read).length;
}
