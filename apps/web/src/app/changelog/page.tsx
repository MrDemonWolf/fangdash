import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
	title: "Changelog | FangDash",
	description: "Every gameplay change to FangDash, newest first, each linked to its commit.",
};

// Rendered once at build time from the repo's CHANGELOG.md (no runtime fs).
export const dynamic = "force-static";

function getChangelog(): string {
	// ponytail: cwd is apps/web during `next build`; if the build ever runs from the
	// repo root this misses and falls back to the "unavailable" notice below.
	try {
		return readFileSync(join(process.cwd(), "..", "..", "CHANGELOG.md"), "utf8");
	} catch {
		return "";
	}
}

export default function ChangelogPage() {
	const markdown = getChangelog();

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24 pb-16">
			<div className="w-full max-w-2xl">
				<div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-a:text-primary">
					{markdown ? (
						<ReactMarkdown>{markdown}</ReactMarkdown>
					) : (
						<p className="text-muted-foreground">Changelog unavailable.</p>
					)}
				</div>
			</div>
		</main>
	);
}
