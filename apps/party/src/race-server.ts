import type {
	RacePlayer,
	RaceResult,
	RaceRoom,
	ServerMessage,
	ValidatedClientMessage,
} from "@fangdash/shared";
import {
	MAX_PLAYERS_PER_RACE,
	MIN_PLAYERS_TO_START,
	RACE_COUNTDOWN_SECONDS,
	clientMessageSchema,
} from "@fangdash/shared";
import type * as Party from "partykit/server";

export default class RaceServer implements Party.Server {
	room: RaceRoom;
	private countdownInProgress = false;

	constructor(readonly party: Party.Party) {
		this.room = {
			id: party.id,
			status: "waiting",
			seed: crypto.randomUUID(),
			players: [],
			hostId: null,
		};
	}

	onConnect(conn: Party.Connection) {
		this.send(conn, { type: "room_state", payload: this.room });
	}

	onMessage(message: string, sender: Party.Connection) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(message);
		} catch {
			return;
		}

		const result = clientMessageSchema.safeParse(parsed);
		if (!result.success) {
			return;
		}
		const msg: ValidatedClientMessage = result.data;

		switch (msg.type) {
			case "join":
				this.handleJoin(sender, msg.payload);
				break;
			case "update":
				this.handleUpdate(sender, msg.payload);
				break;
			case "died":
				this.handleDied(sender);
				break;
			case "ready":
				this.handleReady(sender);
				break;
			case "kick":
				this.handleKick(sender, msg.payload);
				break;
			case "rematch":
				this.handleRematch(sender);
				break;
		}
	}

	onClose(conn: Party.Connection) {
		const wasHost = conn.id === this.room.hostId;
		this.room.players = this.room.players.filter((p) => p.id !== conn.id);
		this.broadcast({ type: "player_left", payload: { id: conn.id } });

		// Host migration
		if (wasHost) {
			const newHost = this.room.players[0];
			if (newHost) {
				this.room.hostId = newHost.id;
				this.room.players = this.room.players.map((p) => ({
					...p,
					isHost: p.id === newHost.id,
				}));
				this.broadcast({ type: "host_changed", payload: { hostId: newHost.id } });
			} else {
				this.room.hostId = null;
				this.broadcast({ type: "host_changed", payload: { hostId: null } });
			}
		}

		if (this.room.status === "racing" && this.room.players.every((p) => !p.alive)) {
			this.endRace();
		}
	}

	private handleJoin(conn: Party.Connection, payload: { username: string; skinId: string }) {
		if (this.room.players.some((p) => p.id === conn.id)) {
			return;
		}
		if (this.room.status !== "waiting") {
			return;
		}
		if (this.room.players.length >= MAX_PLAYERS_PER_RACE) {
			return;
		}

		const isFirstPlayer = this.room.players.length === 0;

		const player: RacePlayer = {
			id: conn.id,
			username: payload.username,
			skinId: payload.skinId,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			isHost: isFirstPlayer,
		};

		if (isFirstPlayer) {
			this.room.hostId = conn.id;
		}

		this.room.players.push(player);
		this.broadcast({ type: "player_joined", payload: player });
	}

	private handleReady(conn: Party.Connection) {
		if (this.room.status !== "waiting") return;

		const player = this.room.players.find((p) => p.id === conn.id);
		if (!player) return;

		player.ready = true;
		this.broadcast({ type: "player_ready", payload: { id: conn.id, ready: true } });

		const isHost = conn.id === this.room.hostId;
		if (!isHost && this.room.players.length < MIN_PLAYERS_TO_START) return;
		if (isHost) {
			this.startCountdown();
		}
	}

	private async startCountdown() {
		if (this.countdownInProgress) return;
		this.countdownInProgress = true;
		this.room.status = "countdown";

		for (let i = RACE_COUNTDOWN_SECONDS; i > 0; i--) {
			this.broadcast({ type: "countdown", payload: { seconds: i } });
			await new Promise((r) => setTimeout(r, 1000));
		}

		this.room.status = "racing";
		this.room.startedAt = new Date().toISOString();
		this.room.seed = crypto.randomUUID();
		this.broadcast({ type: "race_start", payload: { seed: this.room.seed } });
	}

	private handleUpdate(conn: Party.Connection, payload: { distance: number; score: number }) {
		if (this.room.status !== "racing") {
			return;
		}
		const player = this.room.players.find((p) => p.id === conn.id);
		if (!player?.alive) {
			return;
		}

		player.distance = payload.distance;
		player.score = payload.score;

		this.broadcast({
			type: "player_update",
			payload: {
				id: conn.id,
				distance: payload.distance,
				score: payload.score,
			},
		});
	}

	private handleDied(conn: Party.Connection) {
		if (this.room.status !== "racing") {
			return;
		}
		const player = this.room.players.find((p) => p.id === conn.id);
		if (!player) {
			return;
		}

		player.alive = false;
		player.finishTime = Date.now();
		this.broadcast({ type: "player_died", payload: { id: conn.id } });

		if (this.room.players.every((p) => !p.alive)) {
			this.endRace();
		}
	}

	private handleKick(conn: Party.Connection, payload: { playerId: string }) {
		if (conn.id !== this.room.hostId) return;
		if (this.room.status !== "waiting") return;

		this.room.players = this.room.players.filter((p) => p.id !== payload.playerId);
		this.broadcast({ type: "player_kicked", payload: { id: payload.playerId } });

		// Close the kicked player's connection
		for (const connection of this.party.getConnections()) {
			if (connection.id === payload.playerId) {
				connection.close();
				break;
			}
		}
	}

	private handleRematch(conn: Party.Connection) {
		if (this.room.status !== "finished") return;
		if (conn.id !== this.room.hostId) return;

		// Reset room state
		this.room.status = "waiting";
		this.room.seed = crypto.randomUUID();
		this.room.startedAt = undefined;
		this.room.finishedAt = undefined;
		this.countdownInProgress = false;

		// Reset all players
		this.room.players = this.room.players.map((p) => ({
			...p,
			distance: 0,
			score: 0,
			alive: true,
			ready: false,
			finishTime: undefined,
		}));

		this.broadcast({ type: "room_reset", payload: this.room });
	}

	private endRace() {
		this.room.status = "finished";
		this.room.finishedAt = new Date().toISOString();

		const results: RaceResult[] = this.room.players
			.sort((a, b) => b.score - a.score)
			.map((p, i) => ({
				raceId: this.room.id,
				playerId: p.id,
				placement: i + 1,
				score: p.score,
				distance: p.distance,
			}));

		this.broadcast({ type: "race_end", payload: { results } });
	}

	private broadcast(msg: ServerMessage) {
		this.party.broadcast(JSON.stringify(msg));
	}

	private send(conn: Party.Connection, msg: ServerMessage) {
		conn.send(JSON.stringify(msg));
	}
}
