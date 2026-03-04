import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | FangDash",
  description: "View your FangDash stats, scores, and race history.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
