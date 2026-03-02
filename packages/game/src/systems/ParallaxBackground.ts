import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@fangdash/shared";

interface Layer {
  images: Phaser.GameObjects.Image[];
  speed: number;
}

export class ParallaxBackground {
  private layers: Layer[] = [];

  constructor(scene: Phaser.Scene) {
    this.addLayer(scene, "bg-sky", 0.05);
    this.addLayer(scene, "bg-hills", 0.2);
    this.addLayer(scene, "bg-trees", 0.5);
  }

  private addLayer(scene: Phaser.Scene, key: string, speed: number) {
    const img1 = scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(-10 + this.layers.length);
    const img2 = scene.add.image(GAME_WIDTH * 2, 0, key).setOrigin(0, 0).setDepth(-10 + this.layers.length);

    this.layers.push({
      images: [img1, img2],
      speed,
    });
  }

  update(gameSpeed: number, delta: number) {
    const dt = delta / 1000;

    for (const layer of this.layers) {
      for (const img of layer.images) {
        img.x -= gameSpeed * layer.speed * dt;

        if (img.x <= -(GAME_WIDTH * 2)) {
          img.x += GAME_WIDTH * 4;
        }
      }
    }
  }

  reset() {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      layer.images[0].x = 0;
      layer.images[1].x = GAME_WIDTH * 2;
    }
  }
}
