import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Achievements | FangDash",
	description: "Track your FangDash achievements and unlock rewards.",
};

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function AchievementsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
