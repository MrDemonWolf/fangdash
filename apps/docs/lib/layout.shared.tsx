import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { GAME_URL } from "@/lib/constants.ts";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: "FangDash",
		},
		links: [
			{
				text: "Play",
				url: `${GAME_URL}/play`,
				external: true,
			},
			{
				text: "GitHub",
				url: "https://github.com/MrDemonWolf/fangdash",
				external: true,
			},
		],
	};
}
