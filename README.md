<div align="center">
  <img src="apps/web/public/icons/icon-512.png" alt="FangDash" width="128" />
  <h1>FangDash</h1>
  <p><em>Run with the pack. Dash to the top.</em></p>
  <p>Multiplayer endless runner built for Twitch streamers and their communities.</p>
</div>

You're a wolf. The obstacles don't care. Your chat is watching.

FangDash drops up to four players into the same procedurally generated
gauntlet — same seed, same layout, zero excuses. Race your mods, race your
viewers, or race solo to chase a personal best. Earn skins, rack up
achievements, and watch your name climb the leaderboard while you're live.

## Features

- **Endless Runner** — Jump, slide, and dash through
  procedurally generated obstacle courses. The further you
  run, the faster it gets.
- **Real-Time Multiplayer** — Up to 4 players race the same
  seeded layout simultaneously over WebSockets. Everyone
  sees the same course — fairness is non-negotiable.
- **Twitch-Native** — Sign in with Twitch, invite your chat,
  and let your community race you live on stream.
- **6 Wolf Skins** — Start as a Gray Wolf and unlock your
  way up to the MrDemonWolf skin through milestones.
- **16 Achievements** — Spanning score, distance, games
  played, skill plays, and social categories.
- **Leaderboards with Anti-Cheat** — Server-validated scores
  with per-difficulty and time-period filters
  (daily / weekly / all-time).
- **Difficulty Ramping** — Speed scales from 300 to 800 px/s
  as obstacle gaps tighten around you.
- **Deterministic Seeds** — Seeded PRNG means every racer
  faces the exact same obstacle layout. No luck, only skill.
- **Audio System** — BGM crossfade, SFX, and per-category
  volume controls.
- **PWA** — Install it, play it offline, put it on your
  stream layout.
- **Admin Dashboard** — Player management, score moderation,
  and full race history.

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/MrDemonWolf/fangdash.git
cd fangdash
```

1. Install dependencies:

```bash
bun install
```

1. Set up environment variables:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.local.example apps/web/.env.local
```

1. Start all services in development:

```bash
bun dev
```

The web app runs at `http://localhost:3000` and the API at
`http://localhost:8787`. The docs site runs at `http://localhost:3001`.

## Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Frontend    | Next.js 15, React 19, Tailwind v4    |
| Game Engine | Phaser 3                             |
| API         | Hono on Cloudflare Workers           |
| Database    | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth        | Better Auth with Twitch OAuth        |
| API Layer   | tRPC v11                             |
| Multiplayer | PartyKit (WebSockets)                |
| Monorepo    | Turborepo + bun workspaces           |
| Docs        | Fumadocs + Next.js                   |
| Testing     | Vitest                               |
| CI/CD       | GitHub Actions + Cloudflare Workers  |
| Language    | TypeScript 5.7 (strict mode)         |

## Development

### Prerequisites

- Node.js >= 20
- Bun >= 1.0 (see [bun.sh](https://bun.sh) for installation)
- Cloudflare account (for D1 database and Workers deploys)
- Twitch Developer application (for OAuth)

### Setup

1. Install dependencies:

```bash
bun install
```

1. Create a Cloudflare D1 database:

```bash
cd apps/api
bunx wrangler d1 create fangdash-db
```

1. Update `apps/api/wrangler.toml` with your D1 database ID.

2. Run database migrations:

```bash
cd apps/api
bunx wrangler d1 migrations apply fangdash-db --local
```

1. Configure `apps/api/.dev.vars` with your secrets:

```bash
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:8787
TWITCH_CLIENT_ID=<your-twitch-client-id>
TWITCH_CLIENT_SECRET=<your-twitch-client-secret>
```

1. Configure `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
```

1. Start development:

```bash
bun dev
```

### Development Scripts

- `bun dev` — Start all apps in development mode.
- `bun build` — Build all packages and apps.
- `bun test` — Run all tests with Vitest.
- `bun test:coverage` — Run tests with coverage report.
- `bun typecheck` — Type-check all packages.
- `bun lint` — Lint all packages.
- `bun clean` — Remove all build artifacts.
- `bun check` — Run ESLint + Prettier check.
- `bun format` — Format all files with Prettier.
- `bun format:check` — Check formatting without writing.
- `bun ship` — Deploy API, web, and PartyKit to production.
- `bun ship:api` — Deploy API to Cloudflare Workers.
- `bun ship:web` — Deploy web app to Cloudflare Workers.
- `bun ship:party` — Deploy PartyKit server.
- `bun --filter @fangdash/web generate:icons` — Regenerate favicon and PWA icons from the wolf sprite (web + docs).

### Code Quality

- Strict TypeScript with `strict: true` across all packages.
- Vitest for unit and integration testing.
- GitHub Actions CI runs typecheck, tests, lint, and format check on every PR.
- tRPC for end-to-end type safety between API and frontend.

## Project Structure

```text
fangdash/
├── apps/
│   ├── api/           # Hono API on Cloudflare Workers
│   ├── docs/          # Fumadocs documentation site
│   ├── party/         # PartyKit WebSocket server
│   └── web/           # Next.js frontend
├── packages/
│   ├── game/          # Phaser 3 game engine
│   └── shared/        # Types, constants, skins, achievements
├── .github/
│   └── workflows/     # CI and deploy pipelines
├── turbo.json         # Turborepo task config
└── tsconfig.base.json # Shared TypeScript config
```

## License

[![GitHub license](https://img.shields.io/github/license/MrDemonWolf/fangdash.svg?style=for-the-badge&logo=github)](https://github.com/MrDemonWolf/fangdash/blob/main/LICENSE)

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

---

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
