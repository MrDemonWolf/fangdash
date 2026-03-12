import { GROUND_Y, PLAYER_START_X } from "@fangdash/shared";
import type * as Phaser from "phaser";

export class GhostPlayer {
	readonly sprite: Phaser.GameObjects.Sprite;
	private label: Phaser.GameObjects.Text;
	private scene: Phaser.Scene;

	constructor(scene: Phaser.Scene, username: string, skinKey = "wolf-gray") {
		this.scene = scene;

		// Semi-transparent wolf sprite for the opponent
		this.sprite = scene.add.sprite(PLAYER_START_X, GROUND_Y - 20, skinKey);
		this.sprite.setOrigin(0.5, 1);
		this.sprite.setAlpha(0.5);
		this.sprite.setDepth(1);

		// Username label above the sprite
		this.label = scene.add.text(PLAYER_START_X, GROUND_Y - 60, username, {
			fontSize: "12px",
			color: "#ffffff",
			stroke: "#000000",
			strokeThickness: 2,
			align: "center",
		});
		this.label.setOrigin(0.5, 1);
		this.label.setAlpha(0.7);
		this.label.setDepth(1);
	}

	/**
	 * Set x position based on the distance difference relative to the local player.
	 * Positive offset means the opponent is ahead (to the right).
	 */
	updatePosition(distanceOffset: number) {
		const x = PLAYER_START_X + distanceOffset * 0.5;
		this.sprite.x = x;
		this.label.x = x;
	}

	/** Flash red and fade out to indicate the opponent died. */
	showDeath() {
		this.sprite.setTint(0xff0000);

		this.scene.tweens.add({
			targets: [this.sprite, this.label],
			alpha: 0,
			duration: 600,
			ease: "Power2",
		});
	}

	destroy() {
		this.sprite.destroy();
		this.label.destroy();
	}
}
