import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format.ts";

export const metadata: Metadata = {
	title: "Changelog | FangDash",
	description: "Release notes and updates for FangDash.",
};

interface GitHubRelease {
	id: number;
	tag_name: string;
	name: string;
	body: string;
	published_at: string;
	prerelease: boolean;
}

async function getReleases(): Promise<GitHubRelease[]> {
	try {
		const res = await fetch("https://api.github.com/repos/MrDemonWolf/fangdash/releases", {
			headers: { Accept: "application/vnd.github+json" },
			next: { revalidate: 3600 },
		});
		if (!res.ok) return [];
		return res.json() as Promise<GitHubRelease[]>;
	} catch {
		return [];
	}
}

export default async function ChangelogPage() {
	const releases = await getReleases();

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 pt-24 pb-16">
			<div className="w-full max-w-2xl space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Changelog</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Release notes and updates for FangDash.
					</p>
				</div>

				{releases.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center text-sm text-muted-foreground">
							No releases yet. Check back soon!
						</CardContent>
					</Card>
				) : (
					releases.map((release) => (
						<Card key={release.id}>
							<CardHeader>
								<div className="flex flex-wrap items-center gap-2">
									<CardTitle>{release.name || release.tag_name}</CardTitle>
									<Badge variant="secondary">{release.tag_name}</Badge>
									{release.prerelease && <Badge variant="outline">Pre-release</Badge>}
								</div>
								<p className="text-sm text-muted-foreground">{formatDate(release.published_at)}</p>
							</CardHeader>
							{release.body ? (
								<CardContent>
									<div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-a:text-primary">
										<ReactMarkdown>{release.body}</ReactMarkdown>
									</div>
								</CardContent>
							) : null}
						</Card>
					))
				)}
			</div>
		</main>
	);
}
