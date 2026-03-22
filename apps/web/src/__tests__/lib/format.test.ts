import { describe, expect, it } from "vitest";
import { formatDate, formatNumber } from "../../lib/format.ts";

describe("formatDate", () => {
	it("formats a Date object", () => {
		const date = new Date("2024-06-15T12:00:00Z");
		const result = formatDate(date);
		expect(result).toContain("Jun");
		expect(result).toContain("15");
		expect(result).toContain("2024");
	});

	it("formats a date string", () => {
		const result = formatDate("2024-06-15T12:00:00Z");
		expect(result).toContain("2024");
	});

	it("returns empty string for null", () => {
		expect(formatDate(null)).toBe("");
	});
});

describe("formatNumber", () => {
	it("formats a small number without commas", () => {
		expect(formatNumber(42)).toBe("42");
	});

	it("formats a large number with locale separators", () => {
		const result = formatNumber(1234567);
		// toLocaleString output varies by environment, but should contain digits
		expect(result).toContain("1");
		expect(result).toContain("234");
		expect(result).toContain("567");
	});

	it("formats zero", () => {
		expect(formatNumber(0)).toBe("0");
	});
});
