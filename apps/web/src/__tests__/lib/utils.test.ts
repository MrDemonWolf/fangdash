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

	it("handles undefined and null", () => {
		expect(cn("base", undefined, null, "end")).toBe("base end");
	});

	it("resolves tailwind conflicts (last wins)", () => {
		const result = cn("p-4", "p-2");
		expect(result).toBe("p-2");
	});

	it("returns empty string for no inputs", () => {
		expect(cn()).toBe("");
	});
});
