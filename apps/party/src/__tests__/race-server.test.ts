import type * as Party from "partykit/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RaceServer from "../race-server.ts";

// Token defaults to the connection id so each connection maps to a distinct
// userId via the fetch stub; pass an explicit token to simulate the same user
// reconnecting on a new connection.
function createMockConnection(id: string, token = id): Party.Connection {
	return {
		id,
		uri: `http://localhost/party/test-room?token=${token}`,
		send: vi.fn(),
		close: vi.fn(),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

function createMockParty(id = "test-room"): Party.Party {
	const connections = new Map<string, Party.Connection>();
	return {
		id,
		env: { API_URL: "http://localhost:8787" },
		getConnections: () => connections.values(),
		broadcast: vi.fn(),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

// Derives the userId from the session token cookie, mirroring get-session
function createSessionFetchMock() {
	return vi.fn(async (_url: unknown, init?: RequestInit) => {
		const headers = init?.headers as Record<string, string> | undefined;
		const token = (headers?.["cookie"] ?? "").replace("better-auth.session_token=", "");
		return {
			ok: true,
			json: async () => ({
				session: { id: `session-${token}` },
				user: { id: `user-${token}` },
			}),
		};
	});
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
		vi.stubGlobal("fetch", createSessionFetchMock());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	describe("onConnect", () => {
		it("should send room state on connect", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);

			expect(conn.send).toHaveBeenCalledTimes(1);
			const sent = JSON.parse((conn.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]);
			expect(sent.type).toBe("room_state");
			expect(sent.payload.status).toBe("waiting");
		});

		it("should reject connection without token", async () => {
			const conn = {
				id: "no-token",
				uri: "http://localhost/party/test-room",
				send: vi.fn(),
				close: vi.fn(),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any;
			await server.onConnect(conn);

			expect(conn.close).toHaveBeenCalledWith(4001, "Authentication required");
			// send is called once with the error message before close
			expect(conn.send).toHaveBeenCalledTimes(1);
			const sent = JSON.parse((conn.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]);
			expect(sent.type).toBe("error");
		});

		it("should reject connection with invalid session", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve({ session: null }),
				}),
			);

			const conn = createMockConnection("invalid-session");
			await server.onConnect(conn);

			expect(conn.close).toHaveBeenCalledWith(4003, "Invalid session");
			expect(conn.send).not.toHaveBeenCalled();
		});

		it("should fail closed when API_URL is missing", async () => {
			const partyWithoutApi = {
				...party,
				env: {},
			};
			const serverWithoutApi = new RaceServer(partyWithoutApi as Party.Party);

			const conn = createMockConnection("player-1");
			await serverWithoutApi.onConnect(conn);

			expect(conn.close).toHaveBeenCalledWith(4500, "Server misconfigured");
			expect(conn.send).toHaveBeenCalledTimes(1);
			const sent = JSON.parse((conn.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]);
			expect(sent.type).toBe("error");
			expect(sent.payload.message).toBe("Race server misconfigured");
		});

		it("should reject connection when auth verification fails", async () => {
			vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

			const conn = createMockConnection("player-1");
			await server.onConnect(conn);

			expect(conn.close).toHaveBeenCalledWith(4003, "Auth verification failed");
		});
	});

	describe("join", () => {
		it("should add player to room", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "TestPlayer", skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(1);
			expect(server.room.players[0]?.username).toBe("TestPlayer");
		});

		it("should make first player the host", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Host", skinId: "gray-wolf" },
			});

			expect(server.room.hostId).toBe("player-1");
			expect(server.room.players[0]?.isHost).toBe(true);
		});

		it("should not add duplicate players", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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

		it("should reject join when room is not waiting", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			// Force room to racing state
			server.room.status = "racing";

			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn2);
			sendMessage(server, conn2, {
				type: "join",
				payload: { username: "Late", skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(1);
		});
	});

	describe("ready", () => {
		it("should mark player as ready", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});
			sendMessage(server, conn, { type: "ready" });

			expect(server.room.players[0]?.ready).toBe(true);
		});

		it("should not start countdown with only one player", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Host", skinId: "gray-wolf" },
			});
			sendMessage(server, conn, { type: "ready" });

			// Should stay in waiting — need MIN_PLAYERS_TO_START
			expect(server.room.status).toBe("waiting");
		});

		it("should start countdown when host readies with enough players", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);
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
		it("should update player distance and score during race", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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

		it("should ignore updates when not racing", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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

		it("should ignore updates from dead players", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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

		it("should drop updates arriving within 50ms of the last accepted one", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			server.room.status = "racing";
			const nowSpy = vi.spyOn(Date, "now");

			nowSpy.mockReturnValue(1_000);
			sendMessage(server, conn, {
				type: "update",
				payload: { distance: 100, score: 10 },
			});
			expect(server.room.players[0]?.distance).toBe(100);

			nowSpy.mockReturnValue(1_030);
			sendMessage(server, conn, {
				type: "update",
				payload: { distance: 200, score: 20 },
			});
			expect(server.room.players[0]?.distance).toBe(100);

			// 60ms since the last ACCEPTED update — the dropped one did not reset the window
			nowSpy.mockReturnValue(1_060);
			sendMessage(server, conn, {
				type: "update",
				payload: { distance: 300, score: 30 },
			});
			expect(server.room.players[0]?.distance).toBe(300);
		});

		it("should reset the throttle window when a connection closes", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			server.room.status = "racing";
			const nowSpy = vi.spyOn(Date, "now");
			nowSpy.mockReturnValue(1_000);
			sendMessage(server, conn, {
				type: "update",
				payload: { distance: 100, score: 10 },
			});

			server.onClose(conn);

			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});
			server.room.status = "racing";

			nowSpy.mockReturnValue(1_010);
			sendMessage(server, conn, {
				type: "update",
				payload: { distance: 50, score: 5 },
			});
			expect(server.room.players[0]?.distance).toBe(50);
		});
	});

	describe("died", () => {
		it("should mark player as dead", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			server.room.status = "racing";
			sendMessage(server, conn, { type: "died" });

			expect(server.room.players[0]?.alive).toBe(false);
		});

		it("should end race when all players die", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

	describe("endRace", () => {
		async function setupRace() {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);
			sendMessage(server, conn1, {
				type: "join",
				payload: { username: "P1", skinId: "gray-wolf" },
			});
			sendMessage(server, conn2, {
				type: "join",
				payload: { username: "P2", skinId: "gray-wolf" },
			});
			server.room.status = "racing";
			return { conn1, conn2 };
		}

		function lastRaceEnd() {
			const calls = (party.broadcast as ReturnType<typeof vi.fn>).mock.calls;
			const raceEnds = calls
				.map((c) => JSON.parse(c[0] as string))
				.filter((m) => m.type === "race_end");
			return raceEnds[raceEnds.length - 1];
		}

		it("should break score ties by later death (longer survival wins)", async () => {
			const { conn1, conn2 } = await setupRace();
			const nowSpy = vi.spyOn(Date, "now");

			nowSpy.mockReturnValue(1_000);
			sendMessage(server, conn1, {
				type: "update",
				payload: { distance: 100, score: 50 },
			});
			sendMessage(server, conn2, {
				type: "update",
				payload: { distance: 100, score: 50 },
			});

			sendMessage(server, conn1, { type: "died" });
			nowSpy.mockReturnValue(2_000);
			sendMessage(server, conn2, { type: "died" });

			const raceEnd = lastRaceEnd();
			expect(raceEnd.payload.results[0]).toMatchObject({
				playerId: "player-2",
				placement: 1,
			});
			expect(raceEnd.payload.results[1]).toMatchObject({
				playerId: "player-1",
				placement: 2,
			});
		});

		it("should rank by score before finish time", async () => {
			const { conn1, conn2 } = await setupRace();
			const nowSpy = vi.spyOn(Date, "now");

			nowSpy.mockReturnValue(1_000);
			sendMessage(server, conn1, {
				type: "update",
				payload: { distance: 200, score: 80 },
			});
			sendMessage(server, conn2, {
				type: "update",
				payload: { distance: 100, score: 50 },
			});

			// Higher scorer dies first but still places first
			sendMessage(server, conn1, { type: "died" });
			nowSpy.mockReturnValue(2_000);
			sendMessage(server, conn2, { type: "died" });

			const raceEnd = lastRaceEnd();
			expect(raceEnd.payload.results[0]).toMatchObject({
				playerId: "player-1",
				placement: 1,
				score: 80,
			});
		});

		it("should compose raceId from room id and seed", async () => {
			const { conn1, conn2 } = await setupRace();
			const seed = server.room.seed;

			sendMessage(server, conn1, { type: "died" });
			sendMessage(server, conn2, { type: "died" });

			const raceEnd = lastRaceEnd();
			expect(raceEnd.payload.results).toHaveLength(2);
			for (const result of raceEnd.payload.results) {
				expect(result.raceId).toBe(`test-room:${seed}`);
			}
			expect(`test-room:${seed}`.length).toBeLessThanOrEqual(64);
		});
	});

	describe("kick", () => {
		it("should allow host to kick players", async () => {
			const mockConns = new Map<string, Party.Connection>();
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			mockConns.set("player-1", conn1);
			mockConns.set("player-2", conn2);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(party as any).getConnections = () => mockConns.values();

			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

		it("should not allow non-host to kick", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

		it("should prevent a kicked user from rejoining on a new connection", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

			// Same user (same session token), fresh connection id
			const reconn = createMockConnection("player-2-reconnect", "player-2");
			await server.onConnect(reconn);
			sendMessage(server, reconn, {
				type: "join",
				payload: { username: "Player2", skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(1);
		});

		it("should keep the kick deny-list across a rematch", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

			server.room.status = "finished";
			sendMessage(server, conn1, { type: "rematch" });

			// A rematch must NOT re-admit a player the host kicked from the lobby.
			const reconn = createMockConnection("player-2-reconnect", "player-2");
			await server.onConnect(reconn);
			sendMessage(server, reconn, {
				type: "join",
				payload: { username: "Player2", skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(1);
		});

		it("should clear the kick deny-list when the room empties", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

			server.onClose(conn1);
			expect(server.room.players.length).toBe(0);

			const reconn = createMockConnection("player-2-reconnect", "player-2");
			await server.onConnect(reconn);
			sendMessage(server, reconn, {
				type: "join",
				payload: { username: "Player2", skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(1);
		});
	});

	describe("rematch", () => {
		it("should reset room when host requests rematch", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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

		it("should not allow rematch from non-host", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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

		it("should not allow rematch when not finished", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Host", skinId: "gray-wolf" },
			});

			sendMessage(server, conn, { type: "rematch" });
			expect(server.room.status).toBe("waiting");
		});
	});

	describe("onClose", () => {
		it("should reset room when all players leave", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			server.onClose(conn);

			expect(server.room.players.length).toBe(0);
			expect(server.room.status).toBe("waiting");
			expect(server.room.hostId).toBeNull();
		});

		it("should reset countdown state when all players leave during countdown", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);
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

		it("should remove player on disconnect", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "Player", skinId: "gray-wolf" },
			});

			server.onClose(conn);
			expect(server.room.players.length).toBe(0);
		});

		it("should migrate host on host disconnect", async () => {
			const conn1 = createMockConnection("player-1");
			const conn2 = createMockConnection("player-2");
			await server.onConnect(conn1);
			await server.onConnect(conn2);

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
		it("should ignore invalid JSON", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			server.onMessage("not json", conn);

			expect(server.room.players.length).toBe(0);
		});

		it("should ignore messages with invalid schema", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			server.onMessage(JSON.stringify({ type: "unknown_type" }), conn);

			expect(server.room.players.length).toBe(0);
		});

		it("should reject join with oversized username", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
			sendMessage(server, conn, {
				type: "join",
				payload: { username: "a".repeat(51), skinId: "gray-wolf" },
			});

			expect(server.room.players.length).toBe(0);
		});

		it("should reject update with out-of-bounds values", async () => {
			const conn = createMockConnection("player-1");
			await server.onConnect(conn);
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
