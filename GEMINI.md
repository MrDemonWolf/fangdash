# FangDash: Instructional Context

This document provides essential context for Gemini CLI when working in the FangDash repository. FangDash is a fast-paced multiplayer endless runner built for Twitch streamers and their communities.

## Project Overview

FangDash is a Turborepo monorepo using Bun workspaces. It features real-time racing, unlockable skins, achievements, and Twitch integration.

### Architecture & Tech Stack

- **Monorepo Management:** Turborepo + Bun workspaces.
- **Frontend (`apps/web`):** Next.js 15 (App Router), React 19, Tailwind CSS v4, tRPC client.
- **API (`apps/api`):** Hono on Cloudflare Workers, tRPC v11, Better Auth (Twitch OAuth), Drizzle ORM.
- **Multiplayer (`apps/party`):** PartyKit (WebSockets) for real-time race synchronization.
- **Documentation (`apps/docs`):** Fumadocs + Next.js.
- **Game Engine (`packages/game`):** Phaser 3, integrated into the Next.js frontend.
- **Shared Logic (`packages/shared`):** Game constants, domain types, seeded PRNG for deterministic racing.
- **Database:** Cloudflare D1 (SQLite) managed via Drizzle.

### Data Flow

1. **Web → tRPC → API:** Type-safe requests for scores, skins, and auth.
2. **Web → PartySocket → PartyKit:** Low-latency WebSocket communication for races.
3. **API → Drizzle → D1:** Persistent storage for users, players, and achievements.

## Building and Running

### Prerequisites

- Bun >= 1.0 (Primary package manager and runner)
- Node.js >= 24
- Wrangler (for Cloudflare Workers/D1)

### Key Commands

- `bun dev`: Starts all applications in development mode.
- `bun build`: Builds all packages and apps using Turbo.
- `bun test`: Runs Vitest across the monorepo.
- `bun lint`: Runs ESLint on the entire repository.
- `bun typecheck`: Runs `tsc` across all workspaces.
- `bun format`: Formats code using Prettier.
- `bun clean`: Removes all build artifacts (`.next`, `.turbo`, `dist`, etc.).

### Database Operations (from `apps/api`)

- `bunx wrangler d1 migrations apply fangdash-db --local`: Apply local migrations.
- `bunx drizzle-kit generate`: Generate new migrations from schema changes in `src/db/schema.ts`.

## Development Conventions

### Coding Style

- **File Naming:** Use `kebab-case` for files/directories; `PascalCase` for React components and classes.
- **TypeScript:** Strict mode enabled. Always prefer explicit types over `any`.
- **Exports:** Use barrel exports (`index.ts`) for packages to expose their API.
- **Commits:** Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).

### Workspace Packages

- `@fangdash/api`: API service and database schema.
- `@fangdash/web`: Main game frontend.
- `@fangdash/party`: WebSocket race server.
- `@fangdash/game`: Phaser 3 implementation (entities, scenes, systems).
- `@fangdash/shared`: Constants and types shared between all apps.

### Key Files to Reference

- `apps/api/src/db/schema.ts`: Database structure.
- `packages/shared/src/constants.ts`: Physics, speeds, and game tuning.
- `apps/api/src/trpc/router.ts`: API endpoints.
- `packages/game/src/GameCanvas.ts`: Entry point for Phaser integration.
- `CLAUDE.md`: Additional specific guidance for LLM interactions.

## Deployment

- `bun run ship`: Deploys API, Web, and Party servers to their respective production environments (Cloudflare/PartyKit).
