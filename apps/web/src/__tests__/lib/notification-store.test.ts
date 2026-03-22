import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	addNotification,
	getNotifications,
	getUnreadCount,
	markAllRead,
	clearAll,
	subscribe,
} from "@/lib/notification-store.ts";

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

function createMockLocalStorage() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => store.set(key, value),
		removeItem: (key: string) => store.delete(key),
		clear: () => store.clear(),
		get length() {
			return store.size;
		},
		key: (_index: number) => null,
	} as Storage;
}

let uuidCounter = 0;

beforeEach(() => {
	vi.stubGlobal("window", globalThis);
	vi.stubGlobal("localStorage", createMockLocalStorage());
	uuidCounter = 0;
	vi.stubGlobal("crypto", {
		...globalThis.crypto,
		randomUUID: () => `uuid-${++uuidCounter}`,
	});
	clearAll();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const baseNotification = {
	type: "achievement" as const,
	title: "First Run",
	description: "You completed your first run!",
};

describe("addNotification", () => {
	it("adds to empty store", () => {
		addNotification(baseNotification);
		const items = getNotifications();
		expect(items).toHaveLength(1);
		expect(items[0]?.title).toBe("First Run");
	});

	it("prepends newest first", () => {
		addNotification({ ...baseNotification, title: "First" });
		addNotification({ ...baseNotification, title: "Second" });
		const items = getNotifications();
		expect(items[0]?.title).toBe("Second");
		expect(items[1]?.title).toBe("First");
	});

	it("caps at 10 notifications", () => {
		for (let i = 0; i < 12; i++) {
			addNotification({ ...baseNotification, title: `N${i}` });
		}
		const items = getNotifications();
		expect(items).toHaveLength(10);
		// newest should be N11
		expect(items[0]?.title).toBe("N11");
	});

	it("sets read=false and generates id/createdAt", () => {
		addNotification(baseNotification);
		const item = getNotifications()[0];
		expect(item).toBeDefined();
		expect(item?.read).toBe(false);
		expect(item?.id).toBe("uuid-1");
		expect(typeof item?.createdAt).toBe("number");
	});
});

describe("getUnreadCount", () => {
	it("returns 0 for empty store", () => {
		expect(getUnreadCount()).toBe(0);
	});

	it("counts only unread after markAllRead + new add", () => {
		addNotification(baseNotification);
		addNotification(baseNotification);
		markAllRead();
		addNotification(baseNotification);
		expect(getUnreadCount()).toBe(1);
	});
});

describe("markAllRead", () => {
	it("sets all read to true", () => {
		addNotification(baseNotification);
		addNotification(baseNotification);
		markAllRead();
		const items = getNotifications();
		expect(items.every((n) => n.read)).toBe(true);
	});

	it("preserves length", () => {
		addNotification(baseNotification);
		addNotification(baseNotification);
		markAllRead();
		expect(getNotifications()).toHaveLength(2);
	});
});

describe("clearAll", () => {
	it("empties array", () => {
		addNotification(baseNotification);
		addNotification(baseNotification);
		clearAll();
		expect(getNotifications()).toHaveLength(0);
	});
});

describe("subscribe", () => {
	it("listener called on add", () => {
		const listener = vi.fn();
		subscribe(listener);
		addNotification(baseNotification);
		expect(listener).toHaveBeenCalled();
	});

	it("listener called on markAllRead", () => {
		addNotification(baseNotification);
		const listener = vi.fn();
		subscribe(listener);
		markAllRead();
		expect(listener).toHaveBeenCalled();
	});

	it("listener called on clearAll", () => {
		const listener = vi.fn();
		subscribe(listener);
		clearAll();
		expect(listener).toHaveBeenCalled();
	});

	it("stops after unsubscribe", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);
		unsub();
		addNotification(baseNotification);
		expect(listener).not.toHaveBeenCalled();
	});
});

describe("SSR", () => {
	it("returns [] when window is undefined", () => {
		vi.stubGlobal("window", undefined);
		// The load() function checks typeof window === "undefined"
		// Since we're in a test env, we need to also remove localStorage
		vi.stubGlobal("localStorage", undefined);
		const items = getNotifications();
		expect(items).toEqual([]);
	});
});
