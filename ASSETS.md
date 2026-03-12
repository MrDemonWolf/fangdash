# FangDash — Asset Guide

## Current State

The game uses **real pixel-art assets** for all wolves, obstacles, backgrounds, and audio. Assets are stored in `apps/web/public/` and served statically.

## Wolf Sprites (40x40px, PNG with transparency)

Located in `apps/web/public/wolves/`:

| Filename               | Description               |
| ---------------------- | ------------------------- |
| `wolf-gray.png`        | Default gray wolf         |
| `wolf-shadow.png`      | Shadow wolf (dark)        |
| `wolf-fire.png`        | Fire wolf (orange/red)    |
| `wolf-storm.png`       | Storm wolf (electric)     |
| `wolf-blood-moon.png`  | Blood moon wolf (crimson) |
| `wolf-mrdemonwolf.png` | MrDemonWolf (legendary)   |

## Obstacles (PNG with transparency)

Located in `apps/web/public/obstacles/`:

| Filename             | Size  | Description |
| -------------------- | ----- | ----------- |
| `obstacle-rock.png`  | 30x30 | Rock        |
| `obstacle-log.png`   | 50x25 | Fallen log  |
| `obstacle-bush.png`  | 35x28 | Bush        |
| `obstacle-spike.png` | 20x40 | Spike trap  |

## Backgrounds (PNG)

Located in `apps/web/public/backgrounds/`:

| Filename       | Size     | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| `bg-sky.png`   | 800x600  | Night sky (furthest layer)                      |
| `bg-hills.png` | 1600x600 | Rolling hills (mid layer, transparent bg)       |
| `bg-trees.png` | 1600x600 | Tree silhouettes (near layer, transparent bg)   |
| `ground.png`   | 800x100  | Ground tile (seamlessly repeating horizontally) |

## Audio

Located in `apps/web/public/audio/`:

### BGM (Background Music)

| Filename       | Description            |
| -------------- | ---------------------- |
| `bgm-menu.mp3` | Menu/lobby music       |
| `bgm-game.mp3` | Solo gameplay music    |
| `bgm-race.mp3` | Multiplayer race music |

### SFX (Sound Effects)

| Filename              | Description        |
| --------------------- | ------------------ |
| `sfx-jump.mp3`        | Jump               |
| `sfx-double-jump.mp3` | Double jump        |
| `sfx-hit.mp3`         | Obstacle collision |
| `sfx-game-over.mp3`   | Game over          |
| `sfx-milestone.mp3`   | Distance milestone |
| `sfx-countdown.mp3`   | Race countdown     |
| `sfx-achievement.mp3` | Achievement earned |
| `sfx-skin-equip.mp3`  | Skin equipped      |
| `sfx-victory.mp3`     | Race victory       |

## Notes

- All sprites should have **transparent backgrounds**
- Background layers (`bg-hills`, `bg-trees`) need transparent backgrounds so they layer properly
- `ground.png` should tile seamlessly when repeated horizontally
- Wolf sprites will eventually support animation (sprite sheets), but single frames work for MVP

---

## Logo & Icon Design Brief

### Concept

A stylized wolf fang/tooth combined with a speed/dash element. The wolf theme should be prominent but not childish — modern, slightly playful, and game-appropriate for a 13+ audience.

### Color Palette

| Color       | Hex       | Usage                      |
| ----------- | --------- | -------------------------- |
| Deep Navy   | `#091533` | Primary background         |
| Cyan        | `#0FACED` | Accents, highlights        |
| Fang Orange | `#FF6B2B` | Wolf fang, CTA elements    |
| Gold        | `#FFD700` | Achievements, premium feel |

### Icon Assets

Icons are generated via `apps/web/scripts/generate-icons.mjs`, which crops the wolf head from `public/wolves/wolf-mrdemonwolf.png`, centres it on a white circle, and outputs PNGs to `apps/web/public/icons/` and `apps/docs/public/icons/`.

Generated icons in `apps/web/public/icons/`:

| Filename                | Size    | Description       |
| ----------------------- | ------- | ----------------- |
| `icon-32.png`           | 32x32   | Favicon           |
| `icon-192.png`          | 192x192 | PWA icon          |
| `icon-512.png`          | 512x512 | PWA icon (large)  |
| `icon-512-maskable.png` | 512x512 | PWA maskable icon |
| `icon.svg`              | —       | SVG favicon       |
| `icon-head.svg`         | —       | Wolf head SVG     |

### Open Graph Image

The OG image is dynamically generated via Satori at `/api/og` — no static `og-image.png` file is needed.

### Style Direction

- **Modern and clean** with sharp edges evoking speed and wolf fangs
- **Slightly playful** but not cartoonish — think competitive gaming, not children's game
- The fang shape can double as a forward-pointing arrow or speed streak
- Negative space tricks are welcome (e.g., wolf silhouette formed by fang shapes)
- Should be recognizable at small sizes (favicon) and large sizes (OG image)
- Consider how the icon looks on both dark and light OS backgrounds
