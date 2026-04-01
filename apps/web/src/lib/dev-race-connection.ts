import type { RacePlayer, RaceResult, ServerMessage } from "@fangdash/shared";
import type { ConnectionState, RaceConnectionOptions } from "./party.ts";

// ── Mirror event types from party.ts ──

type ServerMessageType = ServerMessage["type"];
type ServerMessagePayload<T extends ServerMessageType> =
	Extract<ServerMessage, { type: T }> extends { payload: infer P } ? P : undefined;
type EventHandler<T extends ServerMessageType> = (payload: ServerMessagePayload<T>) => void;

// ── Bot constants ──

const DEV_PLAYER_ID = "dev-player";
const BOT_ID = "dev-bot-1";
const BOT_NAME = "DevBot";
const BOT_SKIN = "gray-wolf";
/** Distance units the bot travels per second (±10% variance per tick) */
const BOT_SPEED_BASE = 250;
const BOT_UPDATE_INTERVAL_MS = 100;
const BOT_DEATH_MIN_MS = 15_000;
const BOT_DEATH_MAX_MS = 25_000;

/**
 * A local-only mock that implements the same public API as RaceConnection but
 * simulates the full race flow (countdown → race start → bot ghost → race end)
 * without requiring a real PartyKit server or a second authenticated player.
 *
 * Only used when `?dev=true` is present in the URL **and** the API URL points
 * to localhost — so it can never activate in production.
 */
export class DevRaceConnection {
	private readonly options: RaceConnectionOptions;
	private listeners = new Map<string, Set<EventHandler<ServerMessageType>>>();
	private _state: ConnectionState = "connecting";

	// Local state tracked for race results
	private raceId = "";
	private localUsername = "";
	private localSkinId = "";
	private localScore = 0;
	private localDistance = 0;
	private botDistance = 0;
	private botScore = 0;
	private botAlive = true;

	// Timer handles
	private botUpdateTimer: ReturnType<typeof setInterval> | null = null;
	private botDeathTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingTimers: ReturnType<typeof setTimeout>[] = [];

	constructor(options: RaceConnectionOptions) {
		this.options = options;
		// Report connected on the next tick so listeners are registered first
		const t = setTimeout(() => {
			this._state = "connected";
			options.onConnectionStateChange?.("connected");
		}, 0);
		this.pendingTimers.push(t);
	}

	// ── Public send methods (mirror RaceConnection) ──

	join(username: string, skinId: string): void {
		this.localUsername = username;
		this.localSkinId = skinId;
		this.raceId = crypto.randomUUID();

		const localPlayer: RacePlayer = {
			id: DEV_PLAYER_ID,
			username,
			skinId,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			isHost: true,
		};
		const bot: RacePlayer = {
			id: BOT_ID,
			username: BOT_NAME,
			skinId: BOT_SKIN,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			isHost: false,
		};

		// Small delay so the page registers all message handlers first
		this.schedule(() => {
			this.emit("room_state", {
				id: this.raceId,
				status: "waiting",
				seed: "",
				players: [localPlayer, bot],
				hostId: DEV_PLAYER_ID,
			});
			// Bot auto-readies after 1 second
			this.schedule(() => {
				this.emit("player_ready", { id: BOT_ID, ready: true });
			}, 1000);
		}, 50);
	}

	sendReady(): void {
		// 3-2-1 countdown then race start
		this.schedule(() => this.emit("countdown", { seconds: 3 }), 0);
		this.schedule(() => this.emit("countdown", { seconds: 2 }), 1000);
		this.schedule(() => this.emit("countdown", { seconds: 1 }), 2000);
		this.schedule(() => {
			const seed = crypto.randomUUID();
			this.emit("race_start", { seed });
			this.startBotSimulation();
		}, 3000);
	}

	/** Track local position so we can compute accurate race results */
	sendUpdate(distance: number, score: number): void {
		this.localDistance = distance;
		this.localScore = score;
	}

	sendDied(): void {
		this.stopBotTimers();
		// Short pause before results so the death animation can play
		this.schedule(() => this.endRace(), 500);
	}

	/** No-op — there is no second player to kick in dev mode */
	sendKick(_playerId: string): void {}

	sendRematch(): void {
		this.stopBotTimers();
		this.pendingTimers.forEach(clearTimeout);
		this.pendingTimers = [];

		this.localScore = 0;
		this.localDistance = 0;
		this.botDistance = 0;
		this.botScore = 0;
		this.botAlive = true;
		this.raceId = crypto.randomUUID();

		const localPlayer: RacePlayer = {
			id: DEV_PLAYER_ID,
			username: this.localUsername,
			skinId: this.localSkinId,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			isHost: true,
		};
		const bot: RacePlayer = {
			id: BOT_ID,
			username: BOT_NAME,
			skinId: BOT_SKIN,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			isHost: false,
		};

		this.emit("room_reset", {
			id: this.raceId,
			status: "waiting",
			seed: "",
			players: [localPlayer, bot],
			hostId: DEV_PLAYER_ID,
		});

		// Bot auto-readies again
		this.schedule(() => {
			this.emit("player_ready", { id: BOT_ID, ready: true });
		}, 1000);
	}

	disconnect(): void {
		this.stopBotTimers();
		this.pendingTimers.forEach(clearTimeout);
		this.pendingTimers = [];
		this._state = "disconnected";
		this.options.onConnectionStateChange?.("disconnected");
	}

	// ── Public receive API (mirror RaceConnection) ──

	on<T extends ServerMessageType>(event: T, handler: EventHandler<T>): () => void {
		let handlers = this.listeners.get(event);
		if (!handlers) {
			handlers = new Set();
			this.listeners.set(event, handlers);
		}
		handlers.add(handler as unknown as EventHandler<ServerMessageType>);
		return () => {
			handlers?.delete(handler as unknown as EventHandler<ServerMessageType>);
			if (handlers?.size === 0) this.listeners.delete(event);
		};
	}

	off(event?: ServerMessageType): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}

	// ── Getters (mirror RaceConnection) ──

	get state(): ConnectionState {
		return this._state;
	}

	get reconnectCount(): number {
		return 0;
	}

	/** Always OPEN (1) — no real socket in dev mode */
	get readyState(): number {
		return 1;
	}

	/** Returns the fixed dev player ID — must match the room_state payload */
	get id(): string {
		return DEV_PLAYER_ID;
	}

	// ── Internals ──

	private emit<T extends ServerMessageType>(type: T, payload?: ServerMessagePayload<T>): void {
		const handlers = this.listeners.get(type);
		if (!handlers) return;
		for (const handler of handlers) {
			handler(payload as never);
		}
	}

	private schedule(fn: () => void, delay: number): void {
		const t = setTimeout(fn, delay);
		this.pendingTimers.push(t);
	}

	private startBotSimulation(): void {
		this.botAlive = true;
		this.botDistance = 0;
		this.botScore = 0;

		// Send bot position updates at the same ~100ms interval as a real player
		this.botUpdateTimer = setInterval(() => {
			if (!this.botAlive) return;
			// ~250 distance units/sec with ±10% random variance per tick
			const variance = 0.9 + Math.random() * 0.2;
			this.botDistance += (BOT_SPEED_BASE * variance * BOT_UPDATE_INTERVAL_MS) / 1000;
			this.botScore = Math.floor(this.botDistance * 10);
			this.emit("player_update", {
				id: BOT_ID,
				distance: this.botDistance,
				score: this.botScore,
			});
		}, BOT_UPDATE_INTERVAL_MS);

		// Bot dies at a random time between 15–25 seconds
		const deathDelay = BOT_DEATH_MIN_MS + Math.random() * (BOT_DEATH_MAX_MS - BOT_DEATH_MIN_MS);
		this.botDeathTimer = setTimeout(() => {
			this.botAlive = false;
			if (this.botUpdateTimer) {
				clearInterval(this.botUpdateTimer);
				this.botUpdateTimer = null;
			}
			this.emit("player_died", { id: BOT_ID });
		}, deathDelay);
	}

	private stopBotTimers(): void {
		if (this.botUpdateTimer) {
			clearInterval(this.botUpdateTimer);
			this.botUpdateTimer = null;
		}
		if (this.botDeathTimer) {
			clearTimeout(this.botDeathTimer);
			this.botDeathTimer = null;
		}
	}

	private endRace(): void {
		const entries = [
			{ playerId: DEV_PLAYER_ID, score: this.localScore, distance: this.localDistance },
			{ playerId: BOT_ID, score: this.botScore, distance: this.botDistance },
		].sort((a, b) => b.score - a.score);

		const results: RaceResult[] = entries.map((entry, index) => ({
			raceId: this.raceId,
			playerId: entry.playerId,
			placement: index + 1,
			score: entry.score,
			distance: entry.distance,
		}));

		this.emit("race_end", { results });
	}
}
