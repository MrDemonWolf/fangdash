declare module "*.css" {}

// Fallback types for fumadocs-mdx generated .source directory.
// When .source exists (dev/build/CI after postinstall), real types are used.
// This prevents typecheck failures if .source hasn't been generated yet.
declare module "@/.source/*" {
	export const docs: import("fumadocs-mdx/runtime/server").DocsSource;
}
