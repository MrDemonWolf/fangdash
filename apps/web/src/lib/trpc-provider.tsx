"use client";

import type { AppRouter } from "@fangdash/api/trpc";
import { TRPCClientError } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { TRPCProvider as TRPCCtxProvider } from "./trpc.ts";

const apiUrl = process.env["NEXT_PUBLIC_API_URL"];
if (!apiUrl) {
	throw new Error("NEXT_PUBLIC_API_URL is required for tRPC client");
}

// ---------------------------------------------------------------------------
// 429 retry helpers
// ---------------------------------------------------------------------------

function is429(error: unknown): boolean {
	if (error instanceof TRPCClientError) {
		// tRPC httpBatchLink surfaces HTTP status in error.data
		const data = error.data as Record<string, unknown> | undefined;
		const shapeData = error.shape?.data as Record<string, unknown> | undefined;
		const status = data?.["httpStatus"] ?? shapeData?.["httpStatus"];
		return status === 429;
	}
	return false;
}

function getRetryAfterMs(error: unknown): number | null {
	if (error instanceof TRPCClientError) {
		const meta = error.meta as { response?: Response } | undefined;
		const header = meta?.response?.headers?.get("Retry-After");
		if (header) {
			const seconds = Number(header);
			if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
		}
	}
	return null;
}

const MAX_429_RETRIES = 3;

function shouldRetry429(failureCount: number, error: Error): boolean {
	if (is429(error) && failureCount < MAX_429_RETRIES) return true;
	return false;
}

function retryDelay429(attemptIndex: number, error: Error): number {
	const retryAfter = getRetryAfterMs(error);
	if (retryAfter) return retryAfter;
	// Exponential backoff: 1s, 2s, 4s
	return Math.min(1000 * 2 ** attemptIndex, 8000);
}

// ---------------------------------------------------------------------------
// tRPC link config (shared between vanilla + provider clients)
// ---------------------------------------------------------------------------

function createLinks() {
	return [
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
	];
}

/** Vanilla tRPC client for imperative (non-hook) calls */
export const trpcVanilla = createTRPCClient<AppRouter>({
	links: createLinks(),
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60_000,
						gcTime: 5 * 60_000,
						retry: shouldRetry429,
						retryDelay: retryDelay429,
					},
					mutations: {
						retry: shouldRetry429,
						retryDelay: retryDelay429,
						onError: (error) => {
							if (is429(error)) {
								toast.warning("Slow down a bit!", {
									description: "Try again in a moment.",
									duration: 4000,
								});
							}
						},
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: createLinks(),
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
