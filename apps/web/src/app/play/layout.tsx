import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play | FangDash",
  description: "Play FangDash — dodge obstacles and compete for high scores.",
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
