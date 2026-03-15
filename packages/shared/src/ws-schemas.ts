import { z } from "zod";

export const joinMessageSchema = z.object({
	type: z.literal("join"),
	payload: z.object({
		username: z.string().min(1).max(50),
		skinId: z.string().min(1).max(100),
	}),
});

export const updateMessageSchema = z.object({
	type: z.literal("update"),
	payload: z.object({
		distance: z.number().min(0).max(1_000_000),
		score: z.number().int().min(0).max(10_000_000),
	}),
});

export const diedMessageSchema = z.object({
	type: z.literal("died"),
});

export const readyMessageSchema = z.object({
	type: z.literal("ready"),
});

export const kickMessageSchema = z.object({
	type: z.literal("kick"),
	payload: z.object({
		playerId: z.string().min(1).max(100),
	}),
});

export const rematchMessageSchema = z.object({
	type: z.literal("rematch"),
});

export const clientMessageSchema = z.discriminatedUnion("type", [
	joinMessageSchema,
	updateMessageSchema,
	diedMessageSchema,
	readyMessageSchema,
	kickMessageSchema,
	rematchMessageSchema,
]);

export type ValidatedClientMessage = z.infer<typeof clientMessageSchema>;
