import { router, publicProcedure } from "./trpc";
import { scoreRouter } from "./routers/score";
import { skinRouter } from "./routers/skin";
import { achievementRouter } from "./routers/achievement";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok" };
  }),
  score: scoreRouter,
  skin: skinRouter,
  achievement: achievementRouter,
});

export type AppRouter = typeof appRouter;
