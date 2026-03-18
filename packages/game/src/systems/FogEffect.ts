import { GAME_HEIGHT, GAME_WIDTH } from "@fangdash/shared";
import * as Phaser from "phaser";

const FOG_START_RADIUS = 350;
const FOG_MIN_RADIUS = 140;
const FOG_SHRINK_DISTANCE = 4500;
const FOG_ALPHA = 0.92;

/**
 * Radial fog vignette that shrinks over distance.
 * Uses a RenderTexture overlay — reliable across WebGL and Canvas.
 */
export class FogEffect {
	private rt: Phaser.GameObjects.RenderTexture;
	private brush: Phaser.GameObjects.Graphics;
	private currentRadius = FOG_START_RADIUS;

	constructor(scene: Phaser.Scene) {
		// Full-screen render texture for the darkness overlay
		this.rt = scene.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT);
		this.rt.setOrigin(0, 0);
		this.rt.setDepth(9998);

		// Off-screen graphics used as a "brush" to stamp the light hole
		this.brush = scene.add.graphics();
		this.brush.setVisible(false);
	}

	update(playerX: number, playerY: number, distance: number) {
		const t = Math.min(distance / FOG_SHRINK_DISTANCE, 1);
		this.currentRadius = FOG_START_RADIUS - t * (FOG_START_RADIUS - FOG_MIN_RADIUS);
		this.draw(playerX, playerY);
	}

	private draw(cx: number, cy: number) {
		// Fill the RT with dark fog
		this.rt.fill(0x000000, FOG_ALPHA);

		// Draw a radial gradient "light" brush
		this.brush.clear();
		const steps = 16;
		for (let i = steps; i >= 0; i--) {
			const r = this.currentRadius * (i / steps);
			// Inner steps are more opaque (erase more darkness)
			const alpha = 1 - (i / steps) * 0.7;
			this.brush.fillStyle(0xffffff, alpha);
			this.brush.fillCircle(0, 0, r);
		}

		// Erase the light area from the darkness
		this.rt.erase(this.brush, cx, cy);
	}

	destroy() {
		this.rt.destroy();
		this.brush.destroy();
	}
}
