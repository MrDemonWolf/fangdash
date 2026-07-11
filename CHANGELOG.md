# Changelog

Gameplay changes to FangDash, newest first. Each entry links to the commit that
introduced it.

For official release notes, visit
[fangdash.mrdemonwolf.workers.dev/changelog](https://fangdash.mrdemonwolf.workers.dev/changelog).

---

## 2026-06-13 — Multiplayer integrity

- Race connections now authenticated with short-lived signed HMAC tokens minted by the API and verified by the PartyKit server ([4937908](https://github.com/MrDemonWolf/fangdash/commit/4937908))
- Hardened score/race anti-cheat and multiplayer integrity ([da12994](https://github.com/MrDemonWolf/fangdash/commit/da12994))

## 2026-03-31

- Dev-mode multiplayer bypass with bot simulation, so races can be tested solo ([ac59fbf](https://github.com/MrDemonWolf/fangdash/commit/ac59fbf))

## 2026-03-22 — Mods, achievements & in-game HUD

- Mods wired into the race system — Fog / Headwind / Tremor selectable before multiplayer races ([cffaa60](https://github.com/MrDemonWolf/fangdash/commit/cffaa60))
- Achievement system reworked with mod-aware unlock conditions and percentage-based stats (21 total) ([8b47aad](https://github.com/MrDemonWolf/fangdash/commit/8b47aad))
- osu!-inspired in-game UI: input overlay plus configurable HUD settings ([6b6d27f](https://github.com/MrDemonWolf/fangdash/commit/6b6d27f))
- osu!-style leaderboard with multi-mod filtering ([7031ad3](https://github.com/MrDemonWolf/fangdash/commit/7031ad3))
- Responsive `/play` overlay layout ([a3a63e4](https://github.com/MrDemonWolf/fangdash/commit/a3a63e4))

## 2026-03-20

- Offline score storage with batched sync when the connection returns ([d65e94c](https://github.com/MrDemonWolf/fangdash/commit/d65e94c))

## 2026-03-18 — Game Mods

- Opt-in challenge mods (Fog, Headwind, Tremor); each applies a 1.15× score multiplier that stacks multiplicatively (two = 1.322×, three = 1.521×). Runs using a beta mod are unranked, and the multiplier is re-derived server-side to prevent forgery ([627fd45](https://github.com/MrDemonWolf/fangdash/commit/627fd45))

## 2026-03-17

- Anti-cheat flag added to scores and race history to mark suspicious runs ([0e9073a](https://github.com/MrDemonWolf/fangdash/commit/0e9073a))

## 2026-03-14

- Deterministic (seeded) obstacle spawning so every racer faces an identical layout, plus player-creation fixes ([dd34550](https://github.com/MrDemonWolf/fangdash/commit/dd34550))

## 2026-03-13 — Level system

- Level & XP system: every point scored = 1 XP, cubic curve `totalXpForLevel(n) = 5 × (n − 1)³`, with race placement bonuses (1st = 500, 2nd = 250, 3rd = 100 XP) ([c6797de](https://github.com/MrDemonWolf/fangdash/commit/c6797de))
- Hardened achievement/skin awarding to prevent cascading failures ([0e478c4](https://github.com/MrDemonWolf/fangdash/commit/0e478c4))

## 2026-03-12 — Physics & difficulty

- Retuned physics for a chrome-dino-style jump feel — fall gravity, jump-cut (variable jump height), and terminal velocity in the Player ([c240ee8](https://github.com/MrDemonWolf/fangdash/commit/c240ee8), [7418682](https://github.com/MrDemonWolf/fangdash/commit/7418682), [eb55479](https://github.com/MrDemonWolf/fangdash/commit/eb55479))
- `DifficultyLevel` type and per-tier gravity multiplier added to the difficulty scaler ([bd11575](https://github.com/MrDemonWolf/fangdash/commit/bd11575))
- Difficulty selector redesigned as a responsive grid ([c63162d](https://github.com/MrDemonWolf/fangdash/commit/c63162d))
- Per-difficulty leaderboards, plus audio and service-worker improvements ([625767c](https://github.com/MrDemonWolf/fangdash/commit/625767c))

## 2026-03-11 — Multiplayer & collision

- Race room management and streamer mode ([a748375](https://github.com/MrDemonWolf/fangdash/commit/a748375))
- Fixed broken hitboxes ([b7bf185](https://github.com/MrDemonWolf/fangdash/commit/b7bf185))
- Obstacles embedded into the ground; WebSocket auto-reconnection during races ([a5ee1c7](https://github.com/MrDemonWolf/fangdash/commit/a5ee1c7))
- Wolf and obstacle ground alignment ([2cf6ccf](https://github.com/MrDemonWolf/fangdash/commit/2cf6ccf))
- Score anti-cheat aligned with the real scoring formula — 10 pts/sec survived + 50 pts per obstacle cleared ([be5df02](https://github.com/MrDemonWolf/fangdash/commit/be5df02))

## 2026-03-06 — Pause & positioning

- Pause support added to the in-game play menu; wolf starting-position fix ([c2fa5c6](https://github.com/MrDemonWolf/fangdash/commit/c2fa5c6))

## 2026-03-03 — Audio & leaderboard filters

- Audio system: BGM tracks and SFX with a master volume slider and mute ([7f440f0](https://github.com/MrDemonWolf/fangdash/commit/7f440f0))
- Time-period leaderboard filtering — All-time / Weekly / Daily ([3830d49](https://github.com/MrDemonWolf/fangdash/commit/3830d49))
- Hidden debug/cheat menu (dev/admin) — set score & distance, invincibility, skip difficulty ([c4ab203](https://github.com/MrDemonWolf/fangdash/commit/c4ab203))
- Accumulated game-engine improvements across API, web, and engine ([2563c10](https://github.com/MrDemonWolf/fangdash/commit/2563c10))

## 2026-03-02 — Initial game build

- Core Phaser game engine — endless runner: the wolf auto-runs, the player double-jumps over procedurally spawned obstacles ([3286131](https://github.com/MrDemonWolf/fangdash/commit/3286131))
- Game utilities and scoring/backend APIs — seeded PRNG, score & leaderboard tRPC routers ([0e63ebc](https://github.com/MrDemonWolf/fangdash/commit/0e63ebc))
- Collision using actual sprite hitboxes; fullscreen canvas with scaled sprites ([c84070c](https://github.com/MrDemonWolf/fangdash/commit/c84070c), [e707c4f](https://github.com/MrDemonWolf/fangdash/commit/e707c4f))
- Solo play page wired to the game ([b195d40](https://github.com/MrDemonWolf/fangdash/commit/b195d40))
- Multiplayer races: `GhostPlayer` entity + `RaceScene` with live ghost positions ([985cfe3](https://github.com/MrDemonWolf/fangdash/commit/985cfe3)); race lobby and room pages ([318c6dd](https://github.com/MrDemonWolf/fangdash/commit/318c6dd)); race-history router ([a8b6448](https://github.com/MrDemonWolf/fangdash/commit/a8b6448))
- In-game onboarding tutorial for first-time players ([c3d426e](https://github.com/MrDemonWolf/fangdash/commit/c3d426e))
- Wolf skins gallery with equip ([46e171b](https://github.com/MrDemonWolf/fangdash/commit/46e171b)); achievements page ([087df7e](https://github.com/MrDemonWolf/fangdash/commit/087df7e)); leaderboard ([a69c7bf](https://github.com/MrDemonWolf/fangdash/commit/a69c7bf))
- Achievement checker and skin unlocker backend ([d4a28a8](https://github.com/MrDemonWolf/fangdash/commit/d4a28a8))
- Real game art assets replace procedural placeholders ([5938da2](https://github.com/MrDemonWolf/fangdash/commit/5938da2))
- Game HUD, Game Over, and Race Result modals ([db46c3e](https://github.com/MrDemonWolf/fangdash/commit/db46c3e))
