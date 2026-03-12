import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Leaderboard | FangDash",
	description: "See the top FangDash players and their high scores.",
};

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function LeaderboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
