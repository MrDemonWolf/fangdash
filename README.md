# FangDash - Multiplayer Wolf Runner for Twitch

FangDash is a free, open-source multiplayer endless runner built for
Twitch streamers and their communities. Play as a wolf, dodge
procedurally generated obstacles, and race up to four players on an
identical seeded course while your chat watches you climb the
leaderboard. It runs entirely in the browser, no download required.

Run with the pack. Dash to the top.

## Features

- **Endless Runner** — Jump, double-jump, and dash through
  procedurally generated obstacle courses. The further you run,
  the faster it gets.
- **Real-Time Multiplayer** — Up to four players race the same
  seeded layout at once over WebSockets. Everyone sees the same
  course, so fairness is non-negotiable.
- **Twitch-Native** — Sign in with Twitch, invite your chat, and
  let your community race you live on stream.
- **6 Wolf Skins** — Start as the Gray Wolf and unlock your way up
  to the MrDemonWolf skin through score, distance, and race
  milestones.
- **21 Achievements** — Spanning score, distance, games played,
  skill, and social categories, with some rewarding exclusive skins.
- **Leaderboards with Anti-Cheat** — Server-validated scores with
  per-difficulty and time-period filters (daily, weekly, all-time).
- **Difficulty Ramping** — Five tiers scale speed from 300 to 800
  px/s as obstacle gaps tighten around you.
- **Deterministic Seeds** — A seeded PRNG gives every racer the
  exact same obstacle layout. No luck, only skill.
- **Game Modifiers** — Opt-in challenge mods (Fog, Headwind,
  Tremor) apply stacking score multipliers.
- **Audio System** — Background-music crossfade, sound effects, and
  volume controls.
- **PWA** — Install it, play it offline, and drop it on your stream
  layout.
- **Admin Dashboard** — Player management, score moderation, and
  full race history.

## Getting Started

Full documentation lives at
[mrdemonwolf.github.io/fangdash](https://mrdemonwolf.github.io/fangdash).

1. Clone the repository:

```bash
git clone https://github.com/MrDemonWolf/fangdash.git
cd fangdash
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
```

4. Start all services in development:

```bash
bun dev
```

The web app runs at `http://localhost:3000`, the API at
`http://localhost:8787`, and the docs site at
`http://localhost:3001`.

## Usage

1. Open `http://localhost:3000` and sign in with Twitch.
2. Choose **Play** for a solo run, or **Race** to create or join a
   room and share the code with your chat.
3. Optionally toggle Game Modifiers (Fog, Headwind, Tremor) before
   starting for a stacking score multiplier.
4. Press `Space` (or tap/click) to jump, again mid-air to
   double-jump, and hold for extra height.
5. Chase a personal best, climb the per-difficulty leaderboards, and
   unlock skins and achievements as you play.

## Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Frontend    | Next.js 16, React 19, Tailwind v4    |
| Game Engine | Phaser 4                             |
| API         | Hono on Cloudflare Workers           |
| Database    | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth        | Better Auth with Twitch OAuth        |
| API Layer   | tRPC v11                             |
| Multiplayer | PartyKit (WebSockets)                |
| Monorepo    | Turborepo + bun workspaces           |
| Docs        | Fumadocs + Next.js                   |
| Testing     | Vitest                               |
| CI/CD       | GitHub Actions + Cloudflare Workers  |
| Language    | TypeScript 6 (strict mode)           |

## Development

### Prerequisites

- Node.js >= 20
- Bun >= 1.0 (see [bun.sh](https://bun.sh) for installation)
- Cloudflare account (for the D1 database and Workers deploys)
- Twitch developer application (for OAuth)

### Setup

1. Install dependencies:

```bash
bun install
```

2. Create a Cloudflare D1 database:

```bash
cd apps/api
bunx wrangler d1 create fangdash-db
```

3. Update `apps/api/wrangler.toml` with your D1 database ID.

4. Run database migrations:

```bash
cd apps/api
bunx wrangler d1 migrations apply fangdash-db --local
```

5. Configure `apps/api/.dev.vars` with your secrets:

```bash
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:8787
TWITCH_CLIENT_ID=<your-twitch-client-id>
TWITCH_CLIENT_SECRET=<your-twitch-client-secret>
# Shared HMAC secret for short-lived PartyKit race connection tokens.
# Must match the value configured for the PartyKit server.
RACE_TOKEN_SECRET=<your-race-token-secret>
```

6. Configure `apps/party/.env` (loaded by `partykit dev`) with the
   same `RACE_TOKEN_SECRET` so the race server can verify tokens
   minted by the API:

```bash
RACE_TOKEN_SECRET=<your-race-token-secret>
```

7. Configure `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
```

8. Start development:

```bash
bun dev
```

Real-time race connections are authenticated with a short-lived
HMAC token rather than the `httpOnly` session cookie: the web client
mints one via `race.getConnectionToken` (tRPC) and forwards it to
PartyKit as `?token=`, and the race server verifies it with the same
`RACE_TOKEN_SECRET`. That secret must be identical across the API and
PartyKit. See the
[self-hosting guide](https://mrdemonwolf.github.io/fangdash/docs/getting-started/self-hosting)
for production provisioning.

### Development Scripts

- `bun dev` — Start all apps in development mode.
- `bun build` — Build all packages and apps.
- `bun test` — Run all tests with Vitest.
- `bun typecheck` — Type-check all packages.
- `bun lint` — Lint all packages.
- `bun lint:fix` — Lint with auto-fix.
- `bun clean` — Remove all build artifacts.
- `bun check` — Run ESLint plus Prettier check.
- `bun format` — Format all files with Prettier.
- `bun format:check` — Check formatting without writing.
- `bun ship` — Deploy API, web, and PartyKit to production.
- `bun ship:api` — Deploy the API to Cloudflare Workers.
- `bun ship:web` — Deploy the web app to Cloudflare Workers.
- `bun ship:party` — Deploy the PartyKit server.
- `bun --filter @fangdash/web generate:icons` — Regenerate the
  favicon and PWA icons from the wolf sprite (web and docs).

### Code Quality

- Strict TypeScript with `strict: true` across all packages.
- Vitest for unit and integration testing.
- tRPC for end-to-end type safety between the API and frontend.
- GitHub Actions CI runs typecheck, tests, lint, and format checks
  on every pull request.

## Project Structure

```text
fangdash/
├── apps/
│   ├── api/           # Hono API on Cloudflare Workers
│   ├── docs/          # Fumadocs documentation site
│   ├── party/         # PartyKit WebSocket server
│   └── web/           # Next.js frontend
├── packages/
│   ├── game/          # Phaser 4 game engine
│   └── shared/        # Types, constants, skins, achievements
├── .github/
│   └── workflows/     # CI and deploy pipelines
├── turbo.json         # Turborepo task config
└── tsconfig.base.json # Shared TypeScript config
```

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/fangdash.svg?style=for-the-badge&logo=github)

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

---

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
