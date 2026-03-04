import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skins | FangDash",
  description: "Customize your wolf with unlockable skins.",
};

export default function SkinsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
