import { defineConfig } from "vitest/config";

// Vitest 4 replaced the standalone workspace file (defineWorkspace) with the
// `test.projects` field. Each referenced directory supplies its own
// vitest.config.ts (e.g. apps/web sets the jsdom environment).
export default defineConfig({
	test: {
		projects: ["packages/shared", "packages/game", "apps/api", "apps/party", "apps/web"],
	},
});
