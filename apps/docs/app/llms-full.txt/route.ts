import { readFileSync } from "node:fs";
import { source } from "@/lib/source.ts";

export const dynamic = "force-static";
export const revalidate = false;

// A single plain-text projection of every docs page, for LLMs / AI search.
// Reads the raw MDX from disk (via the loader's absolutePath) and strips the
// frontmatter block so the body reads as clean prose.
function stripFrontmatter(raw: string): string {
	return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToText(page: any): string {
	const title: string = page.data?.title ?? page.url;
	const absPath: string | undefined = page.absolutePath ?? page.data?._file?.absolutePath;
	const fallback: string = page.data?.description ?? "";
	let body: string;
	if (absPath) {
		try {
			body = stripFrontmatter(readFileSync(absPath, "utf-8"));
		} catch {
			body = fallback;
		}
	} else {
		body = fallback;
	}
	return `# ${title}\n\n${body}`;
}

export function GET() {
	const text = source.getPages().map(pageToText).join("\n\n---\n\n");
	return new Response(text, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
