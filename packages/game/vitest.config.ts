import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["src/__tests__/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**"],
			exclude: ["src/__tests__/**", "src/index.ts"],
		},
	},
});
