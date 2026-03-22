import { describe, expect, it } from "vitest";
import { cn } from "../../lib/utils.ts";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("handles conditional classes", () => {
		const isHidden = false;
		expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
	});

	it("handles multiple conditional classes", () => {
		const isActive = true;
		const isDisabled = false;
		expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
	});

	it("handles undefined and null", () => {
		expect(cn("base", undefined, null, "end")).toBe("base end");
	});

	it("resolves tailwind conflicts (last wins)", () => {
		const result = cn("p-4", "p-2");
		expect(result).toBe("p-2");
	});

	it("resolves multiple tailwind conflicts", () => {
		const result = cn("p-4 m-2", "p-8 m-4");
		expect(result).toBe("p-8 m-4");
	});

	it("returns empty string for no inputs", () => {
		expect(cn()).toBe("");
	});
});
