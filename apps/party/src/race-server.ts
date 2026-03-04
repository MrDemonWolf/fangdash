import type * as Party from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  RaceRoom,
  RacePlayer,
  RaceResult,
} from "@fangdash/shared";
import {
  MAX_PLAYERS_PER_RACE,
  RACE_COUNTDOWN_SECONDS,
  MIN_PLAYERS_TO_START,
} from "@fangdash/shared";

export default class RaceServer implements Party.Server {
  room: RaceRoom;

  constructor(readonly party: Party.Party) {
    this.room = {
      id: party.id,
      status: "waiting",
      seed: crypto.randomUUID(),
      players: [],
    };
  }

  onConnect(conn: Party.Connection) {
    this.send(conn, { type: "room_state", payload: this.room });
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

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
    }
  }

  onClose(conn: Party.Connection) {
    this.room.players = this.room.players.filter((p) => p.id !== conn.id);
    this.broadcast({ type: "player_left", payload: { id: conn.id } });

    if (this.room.status === "racing" && this.room.players.every((p) => !p.alive)) {
      this.endRace();
    }
  }

  private handleJoin(conn: Party.Connection, payload: { username: string; skinId: string }) {
    if (this.room.players.some((p) => p.id === conn.id)) return;
    if (this.room.status !== "waiting") return;
    if (this.room.players.length >= MAX_PLAYERS_PER_RACE) return;

    const player: RacePlayer = {
      id: conn.id,
      username: payload.username,
      skinId: payload.skinId,
      distance: 0,
      score: 0,
      alive: true,
    };

    this.room.players.push(player);
    this.broadcast({ type: "player_joined", payload: player });
  }

  private handleReady(_conn: Party.Connection) {
    if (this.room.status !== "waiting") return;
    if (this.room.players.length < MIN_PLAYERS_TO_START) return;

    this.startCountdown();
  }

  private async startCountdown() {
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
    if (this.room.status !== "racing") return;
    const player = this.room.players.find((p) => p.id === conn.id);
    if (!player || !player.alive) return;

    player.distance = payload.distance;
    player.score = payload.score;

    this.broadcast({
      type: "player_update",
      payload: { id: conn.id, distance: payload.distance, score: payload.score },
    });
  }

  private handleDied(conn: Party.Connection) {
    if (this.room.status !== "racing") return;
    const player = this.room.players.find((p) => p.id === conn.id);
    if (!player) return;

    player.alive = false;
    player.finishTime = Date.now();
    this.broadcast({ type: "player_died", payload: { id: conn.id } });

    if (this.room.players.every((p) => !p.alive)) {
      this.endRace();
    }
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
