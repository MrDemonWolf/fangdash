import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

const GAME_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://fangdash.mrdemonwolf.workers.dev";

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
