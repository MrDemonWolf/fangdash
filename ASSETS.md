# FangDash — Asset Guide

## Current State

The game uses **programmatically generated placeholder assets** (colored shapes drawn with Phaser's Graphics API in `BootScene.ts`). The game is fully playable without any image files. Swap in real art when ready.

## Assets Needed

### Wolf Sprites (40x40px, PNG with transparency)

| Filename | Description |
|---|---|
| `wolf-gray.png` | Default gray wolf |
| `wolf-arctic.png` | Arctic wolf (white) |
| `wolf-shadow.png` | Shadow wolf (dark) |
| `wolf-fire.png` | Fire wolf (orange/red) |
| `wolf-frost.png` | Frost wolf (ice blue) |
| `wolf-golden.png` | Golden wolf |
| `wolf-storm.png` | Storm wolf (electric) |
| `wolf-blood-moon.png` | Blood moon wolf (crimson) |
| `wolf-spirit.png` | Spirit wolf (ethereal) |
| `wolf-phantom.png` | Phantom wolf (translucent) |

### Obstacles (PNG with transparency)

| Filename | Size | Description |
|---|---|---|
| `obstacle-rock.png` | 30x30 | Rock |
| `obstacle-log.png` | 50x25 | Fallen log |
| `obstacle-bush.png` | 35x28 | Bush |
| `obstacle-spike.png` | 20x40 | Spike trap |

### Backgrounds (PNG)

| Filename | Size | Description |
|---|---|---|
| `bg-sky.png` | 800x600 | Night sky (furthest layer) |
| `bg-hills.png` | 1600x600 | Rolling hills (mid layer, transparent bg) |
| `bg-trees.png` | 1600x600 | Tree silhouettes (near layer, transparent bg) |
| `ground.png` | 800x100 | Ground tile (seamlessly repeating horizontally) |

## Where to Put Them

```
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

| Tool | Best For | Cost |
|---|---|---|
| [Aseprite](https://www.aseprite.org/) | Pixel art sprites & animations | ~$20 |
| [Piskel](https://www.piskelapp.com/) | Pixel art (browser-based) | Free |
| [Photoshop](https://www.adobe.com/products/photoshop.html) / [GIMP](https://www.gimp.org/) | Background art & compositing | Paid / Free |
| [Figma](https://www.figma.com/) | Flat/geometric game art | Free tier |
| AI generators (Midjourney, DALL-E) | Base art to clean up | Varies |

## Notes

- All sprites should have **transparent backgrounds**
- Background layers (`bg-hills`, `bg-trees`) need transparent backgrounds so they layer properly
- `ground.png` should tile seamlessly when repeated horizontally
- Wolf sprites will eventually support animation (sprite sheets), but single frames work for MVP
- Placeholder graphics are fine until the polish phase (Day 6)
