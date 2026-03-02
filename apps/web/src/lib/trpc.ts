import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../api/src/trpc/types";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
