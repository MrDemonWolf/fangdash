import { describe, expect, it } from "vitest";
import { formatTime } from "../../lib/format-time.ts";

describe("formatTime", () => {
	it("formats 0ms", () => {
		const result = formatTime(0);
		expect(result).toContain("0");
		expect(result).toContain("00");
	});

	it("formats seconds correctly", () => {
		const result = formatTime(5000);
		expect(result).toContain("05");
	});

	it("formats minutes and seconds", () => {
		const result = formatTime(65000);
		expect(result).toContain("05");
		expect(result).toContain("1");
	});

	it("formats exact minutes", () => {
		const result = formatTime(120000);
		expect(result).toContain("2");
		expect(result).toContain("00");
	});

	it("pads seconds with leading zero", () => {
		const result = formatTime(61000);
		expect(result).toContain("01");
	});

	it("handles large values", () => {
		const result = formatTime(600000);
		expect(result).toContain("10");
		expect(result).toContain("00");
	});
});
