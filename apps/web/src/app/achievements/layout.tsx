import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievements | FangDash",
  description: "Track your FangDash achievements and unlock rewards.",
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
