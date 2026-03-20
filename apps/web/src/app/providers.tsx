"use client";

import { TRPCProvider } from "@/lib/trpc-provider.tsx";
import { useLoginSync } from "@/lib/login-sync.ts";

function LoginSyncRunner() {
	useLoginSync();
	return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<TRPCProvider>
			<LoginSyncRunner />
			{children}
		</TRPCProvider>
	);
}
