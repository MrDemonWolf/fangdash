import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared.tsx";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function Layout({ children }: { children: ReactNode }) {
	return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
