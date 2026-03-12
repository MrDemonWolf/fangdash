import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared.tsx";
import { source } from "@/lib/source.ts";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout tree={source.getPageTree()} {...baseOptions()}>
			{children}
		</DocsLayout>
	);
}
