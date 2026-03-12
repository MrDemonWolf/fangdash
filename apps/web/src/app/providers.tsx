"use client";

import { TRPCProvider } from "@/lib/trpc-provider.tsx";

export function Providers({ children }: { children: React.ReactNode }) {
	return <TRPCProvider>{children}</TRPCProvider>;
}
