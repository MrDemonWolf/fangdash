# FangDash — Asset Guide

## Current State

The game uses **programmatically generated placeholder assets** (colored shapes drawn with Phaser's Graphics API in `BootScene.ts`). The game is fully playable without any image files. Swap in real art when ready.

## Assets Needed

### Wolf Sprites (40x40px, PNG with transparency)

| Filename              | Description                |
| --------------------- | -------------------------- |
| `wolf-gray.png`       | Default gray wolf          |
| `wolf-arctic.png`     | Arctic wolf (white)        |
| `wolf-shadow.png`     | Shadow wolf (dark)         |
| `wolf-fire.png`       | Fire wolf (orange/red)     |
| `wolf-frost.png`      | Frost wolf (ice blue)      |
| `wolf-golden.png`     | Golden wolf                |
| `wolf-storm.png`      | Storm wolf (electric)      |
| `wolf-blood-moon.png` | Blood moon wolf (crimson)  |
| `wolf-spirit.png`     | Spirit wolf (ethereal)     |
| `wolf-phantom.png`    | Phantom wolf (translucent) |

### Obstacles (PNG with transparency)

| Filename             | Size  | Description |
| -------------------- | ----- | ----------- |
| `obstacle-rock.png`  | 30x30 | Rock        |
| `obstacle-log.png`   | 50x25 | Fallen log  |
| `obstacle-bush.png`  | 35x28 | Bush        |
| `obstacle-spike.png` | 20x40 | Spike trap  |

### Backgrounds (PNG)

| Filename       | Size     | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| `bg-sky.png`   | 800x600  | Night sky (furthest layer)                      |
| `bg-hills.png` | 1600x600 | Rolling hills (mid layer, transparent bg)       |
| `bg-trees.png` | 1600x600 | Tree silhouettes (near layer, transparent bg)   |
| `ground.png`   | 800x100  | Ground tile (seamlessly repeating horizontally) |

## Where to Put Them

```text
apps/web/public/assets/
├── sprites/
│   ├── wolf-gray.png
│   ├── wolf-arctic.png
│   └── ...
├── obstacles/
│   ├── obstacle-rock.png
│   ├── obstacle-log.png
│   ├── obstacle-bush.png
│   └── obstacle-spike.png
└── backgrounds/
    ├── bg-sky.png
    ├── bg-hills.png
    ├── bg-trees.png
    └── ground.png
```

## Recommended Tools

| Tool                                                                                       | Best For                       | Cost        |
| ------------------------------------------------------------------------------------------ | ------------------------------ | ----------- |
| [Aseprite](https://www.aseprite.org/)                                                      | Pixel art sprites & animations | ~$20        |
| [Piskel](https://www.piskelapp.com/)                                                       | Pixel art (browser-based)      | Free        |
| [Photoshop](https://www.adobe.com/products/photoshop.html) / [GIMP](https://www.gimp.org/) | Background art & compositing   | Paid / Free |
| [Figma](https://www.figma.com/)                                                            | Flat/geometric game art        | Free tier   |
| AI generators (Midjourney, DALL-E)                                                         | Base art to clean up           | Varies      |

## Notes

- All sprites should have **transparent backgrounds**
- Background layers (`bg-hills`, `bg-trees`) need transparent backgrounds so they layer properly
- `ground.png` should tile seamlessly when repeated horizontally
- Wolf sprites will eventually support animation (sprite sheets), but single frames work for MVP
- Placeholder graphics are fine until the polish phase (Day 6)

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

### Required Icon Assets

#### Favicon

- `favicon.ico` — multi-resolution (16x16, 32x32, 48x48)

#### PWA Icons

- `apps/web/public/icon-192.png` — 192x192 PNG
- `apps/web/public/icon-512.png` — 512x512 PNG

#### Open Graph Image

- `apps/web/public/og-image.png` — 1200x630 PNG
- Should include the FangDash logo, tagline ("Multiplayer Wolf Runner"), and brand colors

### Style Direction

- **Modern and clean** with sharp edges evoking speed and wolf fangs
- **Slightly playful** but not cartoonish — think competitive gaming, not children's game
- The fang shape can double as a forward-pointing arrow or speed streak
- Negative space tricks are welcome (e.g., wolf silhouette formed by fang shapes)
- Should be recognizable at small sizes (favicon) and large sizes (OG image)
- Consider how the icon looks on both dark and light OS backgrounds

### Placeholder Status

The following files are currently **placeholders** and need real artwork:

- `apps/web/public/favicon.ico`
- `apps/web/public/icon-192.png`
- `apps/web/public/icon-512.png`
- `apps/web/public/og-image.png`
