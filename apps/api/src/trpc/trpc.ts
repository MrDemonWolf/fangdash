import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ensurePlayer } from "../lib/ensure-player.ts";
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
	// Use truthy check: Better Auth may return raw SQLite integer (1) instead of boolean
	if (ctx.user.banned) {
		const banExpires = ctx.user.banExpires
			? new Date(ctx.user.banExpires instanceof Date ? ctx.user.banExpires.getTime() : ctx.user.banExpires)
			: null;
		const isStillBanned = !banExpires || banExpires.getTime() > Date.now();

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

/**
 * Procedure that ensures a player record exists for the authenticated user.
 * Adds `playerRecord` to the context, eliminating repeated ensurePlayer + null-check boilerplate.
 */
export const playerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
	if (!playerRecord) {
		throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create player" });
	}
	return next({ ctx: { ...ctx, playerRecord } });
});

const roleGuard = (allowedRoles: string[], message: string) =>
	protectedProcedure.use(({ ctx, next }) => {
		if (!(ctx.user.role && allowedRoles.includes(ctx.user.role))) {
			throw new TRPCError({ code: "FORBIDDEN", message });
		}
		return next({ ctx });
	});

export const adminProcedure = roleGuard(["admin"], "Admin access required");
