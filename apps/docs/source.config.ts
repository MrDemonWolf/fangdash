import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

// Extend the default frontmatter so each MDX page can drive its own SEO and
// social-card copy. All fields optional — pages fall back to title/description
// and the per-section OG presets when omitted.
const extendedFrontmatter = frontmatterSchema.extend({
	keywords: z.array(z.string()).optional(),
	ogTitle: z.string().optional(),
	ogDescription: z.string().optional(),
	ogEyebrow: z.string().optional(),
	ogChips: z.array(z.string()).optional(),
});

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		schema: extendedFrontmatter,
	},
});

export default defineConfig({});
