import { appRouter } from "../../trpc/router.ts";
import type { TRPCContext } from "../../trpc/context.ts";
import type { TestDb } from "./test-db.ts";

interface TestCallerOptions {
	db: TestDb;
	userId?: string;
	userName?: string;
	userRole?: string;
	banned?: boolean;
	banReason?: string | null;
	banExpires?: Date | null;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createTestCaller(
	opts: TestCallerOptions,
): ReturnType<(typeof appRouter)["createCaller"]> {
	const ctx: TRPCContext = {
		// The test DB is better-sqlite3 drizzle, but the router uses DrizzleD1Database.
		// They share the same query API for our purposes.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		db: opts.db as any,
		auth: null,
		headers: new Headers(),
		session: opts.userId
			? {
					id: "test-session",
					userId: opts.userId,
					token: "test-token",
					expiresAt: new Date(Date.now() + 86400000),
					ipAddress: null,
					userAgent: null,
				}
			: null,
		user: opts.userId
			? {
					id: opts.userId,
					name: opts.userName ?? "TestUser",
					email: `${opts.userId}@test.com`,
					emailVerified: false,
					image: null,
					role: opts.userRole ?? "user",
					banned: opts.banned ?? false,
					banReason: opts.banReason ?? null,
					banExpires: opts.banExpires ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				}
			: null,
	};

	return appRouter.createCaller(ctx);
}
