import type { ClientMessage, ServerMessage } from "@fangdash/shared";
import PartySocket from "partysocket";

// ── Event types derived from ServerMessage ──

type ServerMessageType = ServerMessage["type"];

type ServerMessagePayload<T extends ServerMessageType> =
	Extract<ServerMessage, { type: T }> extends { payload: infer P }
		? P
		: undefined;

type EventHandler<T extends ServerMessageType> = (
	payload: ServerMessagePayload<T>,
) => void;

// ── Connection options ──

export interface RaceConnectionOptions {
	/** Room code to connect to */
	roomCode: string;
	/**
	 * PartyKit host override. Defaults to NEXT_PUBLIC_PARTYKIT_HOST env var.
	 */
	host?: string;
}

// ── RaceConnection class ──

export class RaceConnection {
	private socket: PartySocket;
	private listeners = new Map<string, Set<EventHandler<ServerMessageType>>>();

	constructor(options: RaceConnectionOptions) {
		const host =
			options.host ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

		this.socket = new PartySocket({
			host,
			room: options.roomCode,
			party: "race",
		});

		this.socket.addEventListener("message", (event) => {
			this.handleMessage(event.data);
		});
	}

	// ── Public API: sending messages ──

	/** Send a join message with username and equipped skin */
	join(username: string, skinId: string): void {
		this.send({ type: "join", payload: { username, skinId } });
	}

	/** Send a position/score update — caller controls the interval */
	sendUpdate(distance: number, score: number): void {
		this.send({ type: "update", payload: { distance, score } });
	}

	/** Notify the server that this player has died */
	sendDied(): void {
		this.send({ type: "died" });
	}

	/** Signal that this player is ready to start the race */
	sendReady(): void {
		this.send({ type: "ready" });
	}

	/** Close the WebSocket connection */
	disconnect(): void {
		this.socket.close();
	}

	// ── Public API: receiving messages ──

	/**
	 * Register a typed callback for a specific server message type.
	 * Returns an unsubscribe function.
	 */
	on<T extends ServerMessageType>(
		event: T,
		handler: EventHandler<T>,
	): () => void {
		let handlers = this.listeners.get(event);
		if (!handlers) {
			handlers = new Set();
			this.listeners.set(event, handlers);
		}
		handlers.add(handler as unknown as EventHandler<ServerMessageType>);

		return () => {
			handlers.delete(handler as unknown as EventHandler<ServerMessageType>);
			if (handlers.size === 0) {
				this.listeners.delete(event);
			}
		};
	}

	/** Remove all listeners for a given event, or all listeners if no event specified */
	off(event?: ServerMessageType): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}

	// ── Connection state ──

	/** Expose the underlying socket's readyState for connection-status checks */
	get readyState(): number {
		return this.socket.readyState;
	}

	// ── Internals ──

	private send(msg: ClientMessage): void {
		this.socket.send(JSON.stringify(msg));
	}

	private handleMessage(data: string): void {
		let msg: ServerMessage;
		try {
			msg = JSON.parse(data) as ServerMessage;
		} catch {
			return;
		}

		const handlers = this.listeners.get(msg.type);
		if (!handlers) {
			return;
		}

		const payload = "payload" in msg ? msg.payload : undefined;
		for (const handler of handlers) {
			handler(payload as never);
		}
	}
}
