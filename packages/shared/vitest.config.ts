// biome-ignore lint/correctness/noUndeclaredDependencies: vitest is a workspace root dependency
import { defineConfig } from "vitest/config";

// biome-ignore lint/style/noDefaultExport: required by framework config
export default defineConfig({
	test: {
		globals: true,
	},
});
