import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "FangDash",
    },
    links: [
      {
        text: "Play",
        url: "https://fangdash.mrdemonwolf.workers.dev",
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
