"use client";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import SearchDialog from "@/components/search.tsx";

export function Provider({ children }: { children: ReactNode }) {
	return (
		<RootProvider theme={{ defaultTheme: "dark" }} search={{ SearchDialog }}>
			{children}
		</RootProvider>
	);
}
