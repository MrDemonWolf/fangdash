# FangDash: Instructional Context

This document provides essential context for Gemini CLI when working in the FangDash repository. FangDash is a fast-paced multiplayer endless runner built for Twitch streamers and their communities.

## Project Overview

FangDash is a Turborepo monorepo using Bun workspaces. It features real-time racing, unlockable skins, achievements, a progression system (XP and levels), and Twitch integration.

### Architecture & Tech Stack

- **Monorepo Management:** Turborepo + Bun workspaces.
- **Frontend (`apps/web`):** Next.js 15 (App Router), React 19, Tailwind CSS v4, tRPC client.
- **API (`apps/api`):** Hono on Cloudflare Workers, tRPC v11, Better Auth (Twitch OAuth), Drizzle ORM.
- **Multiplayer (`apps/party`):** PartyKit (WebSockets) for real-time race synchronization.
- **Documentation (`apps/docs`):** Fumadocs + Next.js.
- **Game Engine (`packages/game`):** Phaser 3, integrated into the Next.js frontend via `GameCanvas`.
- **Shared Logic (`packages/shared`):** Game constants, domain types, seeded PRNG for deterministic racing, and progression logic.
- **Database:** Cloudflare D1 (SQLite) managed via Drizzle.

### Data Flow

1. **Web → tRPC → API:** Type-safe requests for scores, skins, progression, and auth.
2. **Web → PartySocket → PartyKit:** Low-latency WebSocket communication for real-time races.
3. **API → Drizzle → D1:** Persistent storage for users, players, scores, and achievements.
4. **Shared → (Web/API/Party/Game):** Unified constants and logic ensuring consistency across all services.

## Building and Running

### Prerequisites

- Bun >= 1.0 (Primary package manager and runner)
- Node.js >= 24
- Wrangler (for Cloudflare Workers/D1)

### Key Commands

- `bun dev`: Starts all applications in development mode.
- `bun build`: Builds all packages and apps using Turbo.
- `bun test`: Runs Vitest across the monorepo.
- `bun test:coverage`: Runs tests with coverage reports.
- `bun lint`: Runs ESLint on the entire repository.
- `bun lint:fix`: Automatically fixes ESLint issues where possible.
- `bun format`: Formats code using Prettier.
- `bun format:check`: Verifies code formatting.
- `bun typecheck`: Runs `tsc` across all workspaces.
- `bun clean`: Removes all build artifacts (`.next`, `.turbo`, `dist`, etc.).

### Database Operations (from `apps/api`)

- `bunx wrangler d1 migrations apply fangdash-db --local`: Apply local migrations.
- `bunx drizzle-kit generate`: Generate new migrations from schema changes in `src/db/schema.ts`.
- `bunx drizzle-kit studio`: Open the Drizzle Studio database explorer.

## Development Conventions

### Coding Style

- **File Naming:** Use `kebab-case` for files/directories; `PascalCase` for React components and classes.
- **TypeScript:** Strict mode enabled. Always prefer explicit types over `any`.
- **Exports:** Use barrel exports (`index.ts`) for packages to expose their API.
- **Commits:** Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).

### Workspace Packages

- `@fangdash/api`: API service, database schema, and tRPC router.
- `@fangdash/web`: Main game frontend, UI components, and client-side logic.
- `@fangdash/party`: WebSocket race server using PartyKit.
- `@fangdash/game`: Phaser 3 implementation (entities, scenes, systems).
- `@fangdash/shared`: Constants, types, and logic shared between all apps (e.g., physics, levels).

### Key Files to Reference

- `apps/api/src/db/schema.ts`: Database structure.
- `packages/shared/src/constants.ts`: Physics, speeds, and game tuning.
- `packages/shared/src/levels.ts`: XP and level calculation logic.
- `apps/api/src/trpc/router.ts`: API endpoints.
- `packages/game/src/GameCanvas.ts`: Entry point for Phaser integration.
- `CLAUDE.md`: Additional specific guidance for LLM interactions.

## Deployment

- `bun run ship`: Deploys API, Web, and Party servers to their respective production environments (Cloudflare/PartyKit).
