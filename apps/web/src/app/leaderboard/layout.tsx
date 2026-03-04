import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | FangDash",
  description: "See the top FangDash players and their high scores.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
