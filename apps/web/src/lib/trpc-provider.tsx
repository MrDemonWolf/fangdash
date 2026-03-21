"use client";

import type { AppRouter } from "@fangdash/api/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { TRPCProvider as TRPCCtxProvider } from "./trpc.ts";

const apiUrl = process.env["NEXT_PUBLIC_API_URL"];
if (!apiUrl) {
	throw new Error("NEXT_PUBLIC_API_URL is required for tRPC client");
}

/** Vanilla tRPC client for imperative (non-hook) calls */
export const trpcVanilla = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${apiUrl}/trpc`,
			transformer: superjson,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				} as RequestInit);
			},
		}),
	],
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60_000, // 1 min — reduces unnecessary refetches
						gcTime: 5 * 60_000, // 5 min garbage collection
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${apiUrl}/trpc`,
					transformer: superjson,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						} as RequestInit);
					},
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCCtxProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCCtxProvider>
		</QueryClientProvider>
	);
}
