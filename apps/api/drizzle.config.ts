import { defineConfig } from "drizzle-kit";

// biome-ignore lint/style/noDefaultExport: required by framework config
export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	driver: "d1-http",
});
