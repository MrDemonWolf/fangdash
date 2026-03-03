import { router, publicProcedure } from "./trpc";
import { scoreRouter } from "./routers/score";
import { skinRouter } from "./routers/skin";
import { achievementRouter } from "./routers/achievement";
import { raceRouter } from "./routers/race";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok" };
  }),
  score: scoreRouter,
  skin: skinRouter,
  achievement: achievementRouter,
  race: raceRouter,
});

export type AppRouter = typeof appRouter;
