"use client";

import { TRPCProvider } from "@/lib/trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
