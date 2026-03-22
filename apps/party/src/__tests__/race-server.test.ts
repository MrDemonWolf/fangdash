import { beforeEach, describe, expect, it, vi } from "vitest";
import RaceServer from "../race-server.ts";
import type * as Party from "partykit/server";

function createMockConnection(id: string): Party.Connection {
  return {
    id,
    send: vi.fn(),
    close: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function createMockParty(id = "test-room"): Party.Party {
  const connections = new Map<string, Party.Connection>();
  return {
    id,
    getConnections: () => connections.values(),
    broadcast: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function sendMessage(server: RaceServer, conn: Party.Connection, msg: unknown) {
  server.onMessage(JSON.stringify(msg), conn);
}

describe("RaceServer", () => {
  let party: Party.Party;
  let server: RaceServer;

  beforeEach(() => {
    party = createMockParty();
    server = new RaceServer(party);
  });

  describe("onConnect", () => {
    it("should send room state on connect", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);

      expect(conn.send).toHaveBeenCalledTimes(1);
      const sent = JSON.parse(
        (conn.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0],
      );
      expect(sent.type).toBe("room_state");
      expect(sent.payload.status).toBe("waiting");
    });
  });

  describe("join", () => {
    it("should add player to room", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "TestPlayer", skinId: "gray-wolf" },
      });

      expect(server.room.players.length).toBe(1);
      expect(server.room.players[0]?.username).toBe("TestPlayer");
    });

    it("should make first player the host", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });

      expect(server.room.hostId).toBe("player-1");
      expect(server.room.players[0]?.isHost).toBe(true);
    });

    it("should not add duplicate players", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      expect(server.room.players.length).toBe(1);
    });

    it("should reject join when room is not waiting", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      // Force room to racing state
      server.room.status = "racing";

      const conn2 = createMockConnection("player-2");
      server.onConnect(conn2);
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Late", skinId: "gray-wolf" },
      });

      expect(server.room.players.length).toBe(1);
    });
  });

  describe("ready", () => {
    it("should mark player as ready", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });
      sendMessage(server, conn, { type: "ready" });

      expect(server.room.players[0]?.ready).toBe(true);
    });

    it("should not start countdown with only one player", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn, { type: "ready" });

      // Should stay in waiting — need MIN_PLAYERS_TO_START
      expect(server.room.status).toBe("waiting");
    });

    it("should start countdown when host readies with enough players", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);
      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });
      sendMessage(server, conn1, { type: "ready" });

      expect(server.room.status).toBe("countdown");
    });
  });

  describe("update", () => {
    it("should update player distance and score during race", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.room.status = "racing";
      sendMessage(server, conn, {
        type: "update",
        payload: { distance: 500, score: 100 },
      });

      expect(server.room.players[0]?.distance).toBe(500);
      expect(server.room.players[0]?.score).toBe(100);
    });

    it("should ignore updates when not racing", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      sendMessage(server, conn, {
        type: "update",
        payload: { distance: 500, score: 100 },
      });

      expect(server.room.players[0]?.distance).toBe(0);
    });

    it("should ignore updates from dead players", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.room.status = "racing";
      const deadPlayer = server.room.players[0];
      if (!deadPlayer) throw new Error("expected player");
      deadPlayer.alive = false;

      sendMessage(server, conn, {
        type: "update",
        payload: { distance: 500, score: 100 },
      });

      expect(server.room.players[0]?.distance).toBe(0);
    });
  });

  describe("died", () => {
    it("should mark player as dead", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.room.status = "racing";
      sendMessage(server, conn, { type: "died" });

      expect(server.room.players[0]?.alive).toBe(false);
    });

    it("should end race when all players die", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);

      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "P1", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "P2", skinId: "gray-wolf" },
      });

      server.room.status = "racing";
      sendMessage(server, conn1, { type: "died" });
      sendMessage(server, conn2, { type: "died" });

      expect(server.room.status).toBe("finished");
    });
  });

  describe("kick", () => {
    it("should allow host to kick players", () => {
      const mockConns = new Map<string, Party.Connection>();
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      mockConns.set("player-1", conn1);
      mockConns.set("player-2", conn2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (party as any).getConnections = () => mockConns.values();

      server.onConnect(conn1);
      server.onConnect(conn2);

      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });

      sendMessage(server, conn1, {
        type: "kick",
        payload: { playerId: "player-2" },
      });

      expect(server.room.players.length).toBe(1);
      expect(conn2.close).toHaveBeenCalled();
    });

    it("should not allow non-host to kick", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);

      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });

      sendMessage(server, conn2, {
        type: "kick",
        payload: { playerId: "player-1" },
      });

      expect(server.room.players.length).toBe(2);
    });
  });

  describe("rematch", () => {
    it("should reset room when host requests rematch", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });

      server.room.status = "finished";
      sendMessage(server, conn, { type: "rematch" });

      expect(server.room.status).toBe("waiting");
      expect(server.room.players[0]?.alive).toBe(true);
      expect(server.room.players[0]?.score).toBe(0);
    });

    it("should not allow rematch from non-host", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);

      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });

      server.room.status = "finished";
      sendMessage(server, conn2, { type: "rematch" });

      expect(server.room.status).toBe("finished");
    });

    it("should not allow rematch when not finished", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });

      sendMessage(server, conn, { type: "rematch" });
      expect(server.room.status).toBe("waiting");
    });
  });

  describe("onClose", () => {
    it("should reset room when all players leave", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.onClose(conn);

      expect(server.room.players.length).toBe(0);
      expect(server.room.status).toBe("waiting");
      expect(server.room.hostId).toBeNull();
    });

    it("should reset countdown state when all players leave during countdown", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);
      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });

      // Start countdown
      sendMessage(server, conn1, { type: "ready" });
      expect(server.room.status).toBe("countdown");

      // Both players leave
      server.onClose(conn1);
      server.onClose(conn2);

      expect(server.room.status).toBe("waiting");
      expect(server.room.players.length).toBe(0);
    });

    it("should remove player on disconnect", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.onClose(conn);
      expect(server.room.players.length).toBe(0);
    });

    it("should migrate host on host disconnect", () => {
      const conn1 = createMockConnection("player-1");
      const conn2 = createMockConnection("player-2");
      server.onConnect(conn1);
      server.onConnect(conn2);

      sendMessage(server, conn1, {
        type: "join",
        payload: { username: "Host", skinId: "gray-wolf" },
      });
      sendMessage(server, conn2, {
        type: "join",
        payload: { username: "Player2", skinId: "gray-wolf" },
      });

      server.onClose(conn1);

      expect(server.room.hostId).toBe("player-2");
      expect(server.room.players[0]?.isHost).toBe(true);
    });
  });

  describe("message validation", () => {
    it("should ignore invalid JSON", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      server.onMessage("not json", conn);

      expect(server.room.players.length).toBe(0);
    });

    it("should ignore messages with invalid schema", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      server.onMessage(JSON.stringify({ type: "unknown_type" }), conn);

      expect(server.room.players.length).toBe(0);
    });

    it("should reject join with oversized username", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "a".repeat(51), skinId: "gray-wolf" },
      });

      expect(server.room.players.length).toBe(0);
    });

    it("should reject update with out-of-bounds values", () => {
      const conn = createMockConnection("player-1");
      server.onConnect(conn);
      sendMessage(server, conn, {
        type: "join",
        payload: { username: "Player", skinId: "gray-wolf" },
      });

      server.room.status = "racing";
      sendMessage(server, conn, {
        type: "update",
        payload: { distance: 2_000_000, score: 100 },
      });

      // Distance should remain 0 since invalid message was rejected
      expect(server.room.players[0]?.distance).toBe(0);
    });
  });
});
