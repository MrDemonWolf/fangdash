import { achievementRouter } from "./routers/achievement.ts";
import { adminRouter } from "./routers/admin.ts";
import { raceRouter } from "./routers/race.ts";
import { scoreRouter } from "./routers/score.ts";
import { skinRouter } from "./routers/skin.ts";
import { publicProcedure, router } from "./trpc.ts";

export const appRouter = router({
	health: publicProcedure.query(() => {
		return { status: "ok" };
	}),
	score: scoreRouter,
	skin: skinRouter,
	achievement: achievementRouter,
	race: raceRouter,
	admin: adminRouter,
});

export type AppRouter = typeof appRouter;
