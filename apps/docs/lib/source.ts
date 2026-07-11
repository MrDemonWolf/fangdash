import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/server.ts";
import { absoluteUrl } from "./site.ts";

// fumadocs-mdx@15+ returns files as a lazy function,
// but the installed fumadocs-core expects an array — resolve it here.
const raw = docs.toFumadocsSource();
const files =
	typeof raw.files === "function" ? (raw.files as unknown as () => typeof raw.files)() : raw.files;

export const source = loader({
	baseUrl: "/docs",
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	source: { ...raw, files } as any,
});

// The compatibility shim above widens page typing to `any`, so callers read
// page.slugs / page.url / page.data.* directly. These helpers centralize the
// per-page OG-image URL and the LLM plain-text projection.

/** Segments + absolute URL for a page's generated OG image. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPageImage(page: any) {
	const segments: string[] = [...page.slugs, "image.png"];
	return {
		segments,
		url: absoluteUrl(`/og/docs/${segments.join("/")}`),
	};
}
