# Duplication Analysis — FangDash Codebase

> Generated 2026-03-22. This document identifies repeated function patterns across the monorepo that should be extracted into shared helpers.

---

## Frontend (`apps/web/src/`)

### 1. `formatDate()` — 2 files, nearly identical

| File                        | Line | Notes                      |
| --------------------------- | ---- | -------------------------- |
| `app/leaderboard/page.tsx`  | ~134 | No null handling           |
| `app/achievements/page.tsx` | ~48  | Handles null, returns `""` |

Both do:

```ts
const d = typeof date === "string" ? new Date(date) : date;
return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
```

**Recommendation:** Extract to `lib/format-date.ts` with null support.

---

### 2. Distance formatting — 6 files, 4 variations

| File                                     | Pattern                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `components/game/GameOverModal.tsx:29`   | `formatDistance()` helper (m → km/m)                   |
| `components/game/GameHUD.tsx:87`         | `Math.floor(distance).toLocaleString()` inline         |
| `components/game/RaceResultModal.tsx:87` | `Math.floor(entry.distance).toLocaleString()}m` inline |
| `app/admin/scores/page.tsx:93`           | `(distance / 1000).toFixed(1)} km` inline              |
| `app/admin/races/page.tsx:91`            | `(distance / 1000).toFixed(1)} km` inline              |
| `app/profile/[id]/page.tsx:19`           | `fmtKm()` helper (m → km)                              |

**Recommendation:** Extract to `lib/format-distance.ts` with a single flexible formatter.

---

### 3. `formatNumber()` — defined once, inlined everywhere else

| File                           | Pattern                                           |
| ------------------------------ | ------------------------------------------------- |
| `app/leaderboard/page.tsx:143` | `formatNumber(n)` defined as `n.toLocaleString()` |
| Multiple other files           | `.toLocaleString()` used inline                   |

**Recommendation:** Extract to `lib/format-number.ts`.

---

### 4. `formatRelativeTime()` — isolated in one component

| File                                 | Line   |
| ------------------------------------ | ------ |
| `components/ui/NotificationBell.tsx` | ~22-31 |

**Recommendation:** Move to `lib/format-relative-time.ts` for reuse.

---

### 5. Hydration `useEffect` — repeated pattern

| File                           | Line |
| ------------------------------ | ---- |
| `app/play/page.tsx`            | ~74  |
| `app/_components/hero-cta.tsx` | ~19  |

Both do: `useEffect(() => setHasMounted(true), []);`

**Recommendation:** Extract to `hooks/use-hydration.ts`.

---

### 6. localStorage access — inconsistent keys, no wrapper

| File                           | Key prefix                                  |
| ------------------------------ | ------------------------------------------- |
| `app/race/[code]/page.tsx:108` | `fangdash:streamer-mode` (colon)            |
| `app/play/page.tsx:317`        | `fangdash_onboarding_complete` (underscore) |

**Recommendation:** Create `lib/storage.ts` with typed getters/setters and consistent key naming.

---

### 7. Stat tile className — identical across profiles

| File                        | Line | Class                                             |
| --------------------------- | ---- | ------------------------------------------------- |
| `app/profile/page.tsx`      | ~137 | `cn("font-mono text-2xl font-bold", tile.accent)` |
| `app/profile/[id]/page.tsx` | ~180 | `cn("font-mono text-2xl font-bold", tile.accent)` |

**Recommendation:** Extract a `<StatTile />` component.

---

## Backend (`apps/api/src/`)

### 8. `ensurePlayer` + TRPCError throw — 3 occurrences

| File                    | Line |
| ----------------------- | ---- |
| `trpc/routers/score.ts` | ~76  |
| `trpc/routers/score.ts` | ~312 |
| `trpc/routers/race.ts`  | ~26  |

All do:

```ts
const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
if (!playerRecord) {
	throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create player" });
}
```

**Recommendation:** Extract to `lib/ensure-player-or-throw.ts`.

---

### 9. TRPCError factory patterns — repeated across routers

| Error Code              | Files                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `NOT_FOUND`             | `skin.ts:33`, `score.ts:446`, `admin.ts:187`                  |
| `INTERNAL_SERVER_ERROR` | `skin.ts:38`, `score.ts:76/312`, `admin.ts:299`, `race.ts:26` |

**Recommendation:** Create `lib/trpc-errors.ts` with factory helpers like `notFound(msg)`, `internalError(msg)`.

---

## Cross-cutting

### 10. `useSession()` loading state — inconsistent naming

Used in 12+ pages with different variable names:

- `isPending` (admin/layout, settings)
- `sessionLoading` (settings, profile)
- `sessionPending` (hero-cta)

**Recommendation:** Standardize on one convention (e.g., `sessionPending`) project-wide.

---

## Priority

| Priority   | Item                      | Files affected | Effort |
| ---------- | ------------------------- | -------------- | ------ |
| **High**   | Distance formatting       | 6 files        | Low    |
| **High**   | `ensurePlayerOrThrow`     | 3 files        | Low    |
| **High**   | `formatDate`              | 2 files        | Low    |
| **Medium** | `formatNumber`            | 5+ files       | Low    |
| **Medium** | localStorage wrapper      | 2+ files       | Medium |
| **Medium** | Hydration hook            | 2 files        | Low    |
| **Low**    | Stat tile component       | 2 files        | Low    |
| **Low**    | TRPCError factories       | 5+ files       | Medium |
| **Low**    | Session naming convention | 12+ files      | Medium |
