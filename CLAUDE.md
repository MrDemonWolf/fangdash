# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FangDash is a multiplayer endless runner game for Twitch streamers. Players race as wolves, dodging obstacles and competing for scores. Built as a Turborepo monorepo with pnpm workspaces.

## Commands

```bash
pnpm dev                # Start all apps: web (3000), api (8787), party (1999), docs (3001)
pnpm build              # Build all packages (respects dependency order)
pnpm test               # Run all tests (Vitest)
pnpm type-check         # Type-check all packages
pnpm lint               # Lint all packages
pnpm clean              # Remove build artifacts

# Run tests for a single workspace
pnpm --filter @fangdash/api test
pnpm --filter @fangdash/shared test

# Type-check a single workspace
pnpm --filter @fangdash/web type-check

# Deploy
pnpm ship               # Deploy all (api, web, party)
pnpm ship:api           # Deploy API to Cloudflare Workers
pnpm ship:web           # Deploy web to Cloudflare Workers
pnpm ship:party         # Deploy PartyKit server

# Icon generation (web + docs)
pnpm --filter @fangdash/web generate:icons

# Database migrations (from apps/api/)
npx wrangler d1 migrations apply fangdash-db --local
npx drizzle-kit generate   # Generate new migration from schema changes
```

## Architecture

**Monorepo layout:**
- `apps/api` — Hono API on Cloudflare Workers, tRPC v11 endpoints, Better Auth (Twitch OAuth), Drizzle ORM with Cloudflare D1 (SQLite)
- `apps/web` — Next.js 15 (App Router, Turbopack), React 19, Tailwind v4, tRPC client via React Query
- `apps/party` — PartyKit WebSocket server for real-time multiplayer race rooms
- `apps/docs` — Fumadocs documentation site
- `packages/game` — Phaser 3 game engine: scenes (Boot, Game, Race), entities (Player, GhostPlayer, Obstacle), systems (parallax, difficulty, scoring)
- `packages/shared` — Domain types, game constants, skin/achievement definitions, seeded PRNG

**Data flow:** Web → tRPC → Hono API → Drizzle → D1 (SQLite). Real-time multiplayer: Web → PartySocket → PartyKit race-server.

**Key patterns:**
- tRPC provides end-to-end type safety between `apps/api` and `apps/web`
- Deterministic multiplayer via seeded PRNG in `packages/shared/src/seeded-random.ts` — all players see identical obstacle layouts
- Game constants (physics, speeds, scoring, difficulty levels) live in `packages/shared/src/constants.ts`
- Database schema at `apps/api/src/db/schema.ts` — includes Better Auth tables (user, session, account) and game tables (player, score, playerSkin, playerAchievement, raceHistory)
- tRPC routers at `apps/api/src/trpc/routers/` — score, skin, achievement, race
- Auth at `apps/api/src/lib/auth.ts` — Better Auth with Twitch OAuth, cookie-based sessions
- Game scenes: `BootScene` (asset loading) → `GameScene` (solo) or `RaceScene` (multiplayer)
- OG image route: `apps/web/src/app/api/og/route.tsx` — uses base64 `<img>` (not `dangerouslySetInnerHTML`) so Satori renders correctly; layout metadata explicitly sets `openGraph.images` and `twitter.images` to `/api/og`
- Icon generation: `apps/web/scripts/generate-icons.mjs` — crops wolf head from `public/wolves/wolf-mrdemonwolf.png`, centres on white circle, outputs PNGs to `apps/web/public/icons/` and `apps/docs/public/icons/`

## Tech Stack

- **Runtime:** Node.js >= 20, pnpm 10.x
- **Language:** TypeScript 5.7, strict mode everywhere
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Game:** Phaser 3
- **API:** Hono, tRPC v11, Better Auth, Drizzle ORM
- **Database:** Cloudflare D1 (SQLite)
- **WebSockets:** PartyKit
- **Testing:** Vitest (workspaces: packages/shared, apps/api)
- **CI:** GitHub Actions — type-check + test on PRs, deploy on main push

## Conventions

- File naming: kebab-case for files, PascalCase for components/classes
- Workspace packages use `@fangdash/` scope (e.g., `@fangdash/shared`, `@fangdash/game`)
- Commit messages: conventional commits (feat:, fix:, docs:, etc.)
- Barrel exports in `index.ts` files for packages
- Web app deploys via OpenNextjs-Cloudflare adapter
