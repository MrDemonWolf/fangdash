import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const docs = defineDocs({
	dir: "content/docs",
});

// biome-ignore lint/style/noDefaultExport: required by framework config
export default defineConfig({});
