# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FangDash is a multiplayer endless runner game for Twitch streamers. Players race as wolves, dodging obstacles and competing for scores. Built as a Turborepo monorepo with bun workspaces.

## Commands

```bash
bun run dev             # Start all apps: web (3000), api (8787), party (1999), docs (3001)
bun run build           # Build all packages (respects dependency order)
bun run test            # Run all tests (Vitest)
bun run typecheck      # Type-check all packages
bun run lint            # Lint all packages (turbo → next lint per workspace)
bun run clean           # Remove build artifacts

# Biome (root-level, runs on entire repo)
bun run check           # Run biome check (lint + format)
bun run format          # Format all files (write)
bun run format:check    # Check formatting without writing
bun run lint:biome      # Run biome lint only

# Run tests for a single workspace
bun run --filter @fangdash/api test
bun run --filter @fangdash/shared test

# Type-check a single workspace
bun run --filter @fangdash/web typecheck

# Deploy
bun run ship            # Deploy all (api, web, party)
bun run ship:api        # Deploy API to Cloudflare Workers
bun run ship:web        # Deploy web to Cloudflare Workers
bun run ship:party      # Deploy PartyKit server

# Icon generation (web + docs)
bun run --filter @fangdash/web generate:icons

# Database migrations (from apps/api/)
bunx wrangler d1 migrations apply fangdash-db --local
bunx drizzle-kit generate   # Generate new migration from schema changes
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

- **Runtime:** Bun, Node.js >= 20
- **Language:** TypeScript 5.7, strict mode everywhere
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Game:** Phaser 3
- **API:** Hono, tRPC v11, Better Auth, Drizzle ORM
- **Database:** Cloudflare D1 (SQLite)
- **WebSockets:** PartyKit
- **Linting/Formatting:** Biome
- **Testing:** Vitest (workspaces: packages/shared, apps/api)
- **CI:** GitHub Actions — typecheck + test on PRs, deploy on main push

## Conventions

- File naming: kebab-case for files, PascalCase for components/classes
- Workspace packages use `@fangdash/` scope (e.g., `@fangdash/shared`, `@fangdash/game`)
- Commit messages: conventional commits (feat:, fix:, docs:, etc.)
- Barrel exports in `index.ts` files for packages
- Web app deploys via OpenNextjs-Cloudflare adapter
