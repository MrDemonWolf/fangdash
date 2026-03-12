import type * as Phaser from "phaser";

const STORAGE_KEY_VOLUME = "fangdash_volume";
const STORAGE_KEY_MUTED = "fangdash_muted";

export class AudioManager {
	private scene: Phaser.Scene;
	private currentBGM: Phaser.Sound.BaseSound | null = null;
	private _volume: number;
	private _muted: boolean;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this._volume = this.loadVolume();
		this._muted = this.loadMuted();

		// Apply initial state to the sound manager
		this.scene.sound.volume = this._volume;
		this.scene.sound.mute = this._muted;
	}

	// ── Getters ──

	get volume(): number {
		return this._volume;
	}

	get muted(): boolean {
		return this._muted;
	}

	// ── BGM ──

	playBGM(key: string): void {
		if (!this.scene.cache.audio.exists(key)) {
			return;
		}

		// Stop current BGM if playing
		this.stopBGM();

		this.currentBGM = this.scene.sound.add(key, { loop: true });
		if (!this._muted) {
			this.currentBGM.play();
		}
	}

	stopBGM(): void {
		if (this.currentBGM) {
			this.currentBGM.stop();
			this.currentBGM.destroy();
			this.currentBGM = null;
		}
	}

	// ── SFX ──

	playSFX(key: string): void {
		if (!this.scene.cache.audio.exists(key)) {
			return;
		}

		this.scene.sound.play(key);
	}

	// ── Volume / Mute ──

	setVolume(value: number): void {
		this._volume = Math.max(0, Math.min(1, value));
		this.scene.sound.volume = this._volume;
		this.saveVolume();
	}

	setMuted(value: boolean): void {
		this._muted = value;
		this.scene.sound.mute = this._muted;
		// Resume BGM if unmuting and BGM was created but never played
		if (!value && this.currentBGM && !this.currentBGM.isPlaying) {
			this.currentBGM.play();
		}
		this.saveMuted();
	}

	toggleMute(): void {
		this.setMuted(!this._muted);
	}

	// ── Persistence ──

	private loadVolume(): number {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
			if (stored !== null) {
				const parsed = Number.parseFloat(stored);
				if (!Number.isNaN(parsed)) {
					return Math.max(0, Math.min(1, parsed));
				}
			}
		} catch {
			// localStorage unavailable (SSR, private browsing, etc.)
		}
		return 0.5;
	}

	private loadMuted(): boolean {
		try {
			return localStorage.getItem(STORAGE_KEY_MUTED) === "true";
		} catch {
			return false;
		}
	}

	private saveVolume(): void {
		try {
			localStorage.setItem(STORAGE_KEY_VOLUME, String(this._volume));
		} catch {
			// Ignore
		}
	}

	private saveMuted(): void {
		try {
			localStorage.setItem(STORAGE_KEY_MUTED, String(this._muted));
		} catch {
			// Ignore
		}
	}
}
