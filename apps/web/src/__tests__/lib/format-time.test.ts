import { describe, expect, it } from "vitest";
import { formatTime } from "../../lib/format.ts";

describe("formatTime", () => {
	it("formats 0ms as 00:00", () => {
		expect(formatTime(0)).toBe("00:00");
	});

	it("formats seconds correctly", () => {
		expect(formatTime(5000)).toBe("00:05");
	});

	it("formats minutes and seconds", () => {
		expect(formatTime(65000)).toBe("01:05");
	});

	it("formats exact minutes", () => {
		expect(formatTime(120000)).toBe("02:00");
	});

	it("pads seconds with leading zero", () => {
		expect(formatTime(61000)).toBe("01:01");
	});

	it("handles large values", () => {
		expect(formatTime(600000)).toBe("10:00");
	});
});
