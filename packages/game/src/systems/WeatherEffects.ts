import {
	GAME_HEIGHT,
	GAME_WIDTH,
	TREMOR_BOB_AMPLITUDE_CAP,
	TREMOR_MAX_BOB_AMPLITUDE,
	TREMOR_MAX_DISTANCE,
	TREMOR_MAX_INTENSITY,
	TREMOR_MAX_STAGGER_MS,
	TREMOR_MIN_INTERVAL,
	TREMOR_START_INTENSITY,
	TREMOR_START_INTERVAL,
	WIND_FORCE_FLOOR,
	WIND_GUST_PERIOD,
	WIND_MAX_DISTANCE,
	WIND_MAX_FORCE,
	WIND_MIN_FORCE,
	type SeededRandom,
} from "@fangdash/shared";
import * as Phaser from "phaser";
import { Player } from "../entities/Player.ts";

export interface WeatherEffect {
	update(delta: number, distance: number, playerX: number, playerY: number): void;
	destroy(): void;
}

// ── Wind ──

export class WindEffect implements WeatherEffect {
	private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
	private player: Player;
	private elapsed = 0;

	constructor(scene: Phaser.Scene, player: Player) {
		this.player = player;
		// Create a small white dot texture for particles
		const gfx = scene.add.graphics();
		gfx.fillStyle(0xffffff, 1);
		gfx.fillCircle(4, 4, 4);
		gfx.generateTexture("wind-particle", 8, 8);
		gfx.destroy();

		this.emitter = scene.add.particles(GAME_WIDTH + 20, GAME_HEIGHT / 2, "wind-particle", {
			lifespan: 2000,
			speedX: { min: -400, max: -200 },
			speedY: { min: -20, max: 20 },
			scale: { start: 0.3, end: 0.1 },
			alpha: { start: 0.4, end: 0 },
			emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
				new Phaser.Geom.Rectangle(
					-20,
					-GAME_HEIGHT / 2,
					40,
					GAME_HEIGHT,
				) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
			),
			frequency: 30,
			quantity: 2,
		});
		this.emitter.setDepth(9990);
	}

	update(delta: number, distance: number, _playerX: number, _playerY: number) {
		this.elapsed += delta;
		const t = Math.min(distance / WIND_MAX_DISTANCE, 1);
		const baseForce = WIND_MIN_FORCE + t * (WIND_MAX_FORCE - WIND_MIN_FORCE);

		const gustOscillation = Math.sin((this.elapsed / WIND_GUST_PERIOD) * Math.PI * 2);
		const gustVariance = (1 - t) * 0.5;
		const gustFactor = 1.0 - gustVariance * (gustOscillation * 0.5 + 0.5);

		const force = Math.max(WIND_FORCE_FLOOR, baseForce * gustFactor);

		if (!this.player.grounded) {
			this.player.externalForceY += force;
		}
	}

	destroy() {
		this.player.externalForceY = 0;
		this.emitter.destroy();
	}
}

// ── Tremor ──

export class TremorEffect implements WeatherEffect {
	private timeSinceShake = 0;
	private currentInterval = TREMOR_START_INTERVAL;
	private currentIntensity = TREMOR_START_INTENSITY;
	private player: Player;
	private rng: SeededRandom;
	private wasGrounded = true;

	constructor(
		private scene: Phaser.Scene,
		player: Player,
		rng: SeededRandom,
	) {
		this.player = player;
		this.rng = rng;
	}

	update(delta: number, distance: number, _playerX: number, _playerY: number) {
		const t = Math.min(distance / TREMOR_MAX_DISTANCE, 1);

		// Camera shake (retuned)
		this.currentInterval =
			TREMOR_START_INTERVAL - t * (TREMOR_START_INTERVAL - TREMOR_MIN_INTERVAL);
		this.currentIntensity =
			TREMOR_START_INTENSITY + t * (TREMOR_MAX_INTENSITY - TREMOR_START_INTENSITY);
		this.timeSinceShake += delta;
		if (this.timeSinceShake >= this.currentInterval) {
			this.timeSinceShake = 0;
			this.scene.cameras.main.shake(350, this.currentIntensity);
		}

		// Chaotic ground bob (deterministic via seeded PRNG)
		const baseAmp = 2 + t * (TREMOR_MAX_BOB_AMPLITUDE - 2);
		const rawAmplitude = baseAmp * (0.7 + this.rng.next() * 0.6);
		this.player.groundBobAmplitude = Math.min(rawAmplitude, TREMOR_BOB_AMPLITUDE_CAP);

		// Landing stagger: detect airborne→grounded transition
		const isGrounded = this.player.grounded;
		if (isGrounded && !this.wasGrounded) {
			this.player.landingStaggerTimer = t * TREMOR_MAX_STAGGER_MS;
		}
		this.wasGrounded = isGrounded;
	}

	destroy() {
		this.player.groundBobAmplitude = 1;
		this.player.landingStaggerTimer = 0;
		this.scene.cameras.main.resetFX();
	}
}
