import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context.ts";

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!(ctx.session && ctx.user)) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	// Ban enforcement — blocks all protected routes
	if (ctx.user.banned === true) {
		const banExpires = ctx.user.banExpires ? new Date(ctx.user.banExpires) : null;
		const isPermaBan = !banExpires;
		const isStillBanned = isPermaBan || banExpires > new Date();

		if (isStillBanned) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: ctx.user.banReason
					? `You are banned: ${ctx.user.banReason}`
					: "Your account has been banned",
			});
		}
	}

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			user: ctx.user,
		},
	});
});

const roleGuard = (allowedRoles: string[], message: string) =>
	protectedProcedure.use(({ ctx, next }) => {
		if (!(ctx.user.role && allowedRoles.includes(ctx.user.role))) {
			throw new TRPCError({ code: "FORBIDDEN", message });
		}
		return next({ ctx });
	});

export const adminProcedure = roleGuard(["admin"], "Admin access required");
