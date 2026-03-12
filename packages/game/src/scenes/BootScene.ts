import {
	AUDIO_KEYS,
	GAME_HEIGHT,
	GAME_WIDTH,
	OBSTACLE_TYPES,
} from "@fangdash/shared";
import { SKINS } from "@fangdash/shared/skins";
// biome-ignore lint/performance/noNamespaceImport: Phaser requires namespace import
import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
	private failedAssets = new Set<string>();

	constructor() {
		super({ key: "BootScene" });
	}

	preload() {
		// Progress bar
		const barW = GAME_WIDTH * 0.6;
		const barH = 20;
		const barX = (GAME_WIDTH - barW) / 2;
		const barY = GAME_HEIGHT / 2;

		const bg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x333333);
		const fill = this.add.rectangle(barX + 2, barY, 0, barH - 4, 0xff6b2b);
		fill.setOrigin(0, 0.5);

		this.load.on("progress", (value: number) => {
			fill.width = (barW - 4) * value;
		});

		this.load.on("complete", () => {
			bg.destroy();
			fill.destroy();
		});

		// Load wolf skin sprites
		for (const skin of SKINS) {
			this.load.image(skin.spriteKey, `/wolves/${skin.spriteKey}.png`);
		}

		// Load obstacle sprites
		for (const type of OBSTACLE_TYPES) {
			this.load.image(`obstacle-${type}`, `/obstacles/obstacle-${type}.png`);
		}

		// Load background sprites
		this.load.image("bg-sky", "/backgrounds/bg-sky.png");
		this.load.image("bg-hills", "/backgrounds/bg-hills.png");
		this.load.image("bg-trees", "/backgrounds/bg-trees.png");
		this.load.image("ground", "/backgrounds/ground.png");

		// Critical assets — built dynamically from skins, obstacles, and backgrounds
		const criticalAssets = new Set<string>([
			...SKINS.map((s) => s.spriteKey),
			...OBSTACLE_TYPES.map((t) => `obstacle-${t}`),
			"bg-sky",
			"bg-hills",
			"bg-trees",
			"ground",
		]);
		// Silently ignore missing audio files so the game works without audio assets
		this.load.on("loaderror", (file: Phaser.Loader.File) => {
			if (file.type === "audio") {
				return; // Audio is optional; continue without it
			}
			console.error(`Failed to load asset: ${file.key} (${file.url})`);
			if (criticalAssets.has(file.key as string)) {
				this.failedAssets.add(file.key as string);
			}
		});

		for (const key of Object.values(AUDIO_KEYS)) {
			this.load.audio(key, `/audio/${key}.mp3`);
		}
	}

	create() {
		// Check if any critical assets failed to load
		if (this.failedAssets && this.failedAssets.size > 0) {
			const failed = [...this.failedAssets].join(", ");
			this.game.events.emit("boot-error", {
				key: failed,
				message:
					"Failed to load game assets. Please check your connection and reload.",
			});
			return;
		}

		// Start whichever game scene is registered (RaceScene or GameScene)
		const target = this.scene.get("RaceScene") ? "RaceScene" : "GameScene";
		this.scene.start(target);
	}
}
