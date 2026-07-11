import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared.tsx";
import { discordUrl, repoUrl } from "@/lib/site.ts";

export default function Layout({ children }: { children: ReactNode }) {
	const year = new Date().getFullYear();
	return (
		<HomeLayout {...baseOptions()}>
			{children}
			<footer className="fd-font fd-bg-base" style={{ borderTop: "1px solid var(--hairline)" }}>
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
					<p className="fd-text-2 text-sm">
						&copy; {year} FangDash by{" "}
						<a
							href="https://www.mrdemonwolf.com"
							target="_blank"
							rel="noopener noreferrer"
							className="fd-text-1 hover:underline"
							style={{ textUnderlineOffset: 3 }}
						>
							MrDemonWolf, Inc.
						</a>
					</p>
					<nav className="fd-text-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
						<a
							href={repoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-[var(--txt-1)]"
						>
							GitHub
						</a>
						<a
							href={discordUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-[var(--txt-1)]"
						>
							Discord
						</a>
						<Link href="/docs" className="transition-colors hover:text-[var(--txt-1)]">
							Docs
						</Link>
						<Link
							href="/docs/legal/privacy-policy"
							className="transition-colors hover:text-[var(--txt-1)]"
						>
							Privacy
						</Link>
						<Link
							href="/docs/legal/terms-of-service"
							className="transition-colors hover:text-[var(--txt-1)]"
						>
							Terms
						</Link>
					</nav>
				</div>
			</footer>
		</HomeLayout>
	);
}
