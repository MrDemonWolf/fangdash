import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { assetPath, gameUrl, repoUrl } from "@/lib/site.ts";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span data-fd-brand className="inline-flex items-center gap-2.5">
					{}
					<img
						src={assetPath("/icons/icon-head.svg")}
						alt=""
						aria-hidden="true"
						className="h-7 w-auto"
					/>
					<span
						className="text-[1.1rem] font-bold tracking-tight"
						style={{ fontFamily: "var(--font-unbounded)", color: "var(--txt-1)" }}
					>
						FangDash
					</span>
				</span>
			),
			url: "/",
			transparentMode: "top",
		},
		githubUrl: repoUrl,
		links: [
			// Landing-section anchors. On the home page these scroll; from any other
			// page they navigate home then jump to the section.
			{ text: "Features", url: "/#features" },
			{ text: "How to play", url: "/#play" },
			{ text: "FAQ", url: "/#faq" },
			{ text: "Docs", url: "/docs" },
			{ text: "Play", url: `${gameUrl}/play`, external: true },
		],
		themeSwitch: {
			enabled: true,
			mode: "light-dark-system",
		},
		searchToggle: {
			enabled: true,
		},
	};
}
