// ---------------------------------------------------------------------------
// Short-lived PartyKit race connection tokens
// ---------------------------------------------------------------------------
//
// The web client cannot read the Better Auth session cookie (it is httpOnly)
// and Better Auth strips the raw session token from the get-session response,
// so the client has no credential to present to the PartyKit race server.
//
// Instead the API mints a short-lived HMAC-signed token bound to the
// authenticated user. The client forwards it as the `?token=` query param when
// opening the race socket, and the PartyKit server verifies it with the same
// shared `RACE_TOKEN_SECRET`. No network round-trip from PartyKit to the API is
// required, and a leaked token expires within minutes.
//
// Token format (compact, JWT-like): `<base64url(payload)>.<base64url(hmac)>`
// where payload is `{ "sub": <userId>, "exp": <unixSeconds> }`.
//
// Implemented with Web Crypto (`crypto.subtle`) so the exact same code runs in
// Cloudflare Workers (API), the PartyKit runtime (workerd), and Node (tests).

/** Default token lifetime in seconds. Short enough to limit replay of a leak. */
export const RACE_TOKEN_TTL_SECONDS = 120;

export interface RaceTokenPayload {
	/** Subject — the authenticated user id. */
	sub: string;
	/** Expiry, unix seconds. */
	exp: number;
}

// ── base64url helpers ──

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
	const base64 = value
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// ── HMAC ──

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
	return new Uint8Array(signature);
}

/** Constant-time byte comparison — avoids leaking signature info via timing. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= (a[i] as number) ^ (b[i] as number);
	}
	return diff === 0;
}

// ── public API ──

export interface SignRaceTokenOptions {
	/** Token lifetime in seconds. Defaults to {@link RACE_TOKEN_TTL_SECONDS}. */
	ttlSeconds?: number;
	/** Override "now" (unix seconds) — for deterministic tests. */
	nowSeconds?: number;
}

/**
 * Mint a short-lived signed token for `userId`. Throws if no secret is given.
 */
export async function signRaceToken(
	userId: string,
	secret: string,
	options: SignRaceTokenOptions = {},
): Promise<string> {
	if (!secret) {
		throw new Error("signRaceToken: secret is required");
	}
	if (!userId) {
		throw new Error("signRaceToken: userId is required");
	}
	const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
	const ttl = options.ttlSeconds ?? RACE_TOKEN_TTL_SECONDS;
	const payload: RaceTokenPayload = { sub: userId, exp: now + ttl };
	const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
	const signature = bytesToBase64Url(await hmacSha256(secret, encodedPayload));
	return `${encodedPayload}.${signature}`;
}

export interface VerifyRaceTokenOptions {
	/** Override "now" (unix seconds) — for deterministic tests. */
	nowSeconds?: number;
}

/**
 * Verify a race token. Returns `{ userId }` when the signature is valid and the
 * token has not expired; returns `null` for any malformed, tampered, or expired
 * token. Never throws on bad input.
 */
export async function verifyRaceToken(
	token: string | null | undefined,
	secret: string,
	options: VerifyRaceTokenOptions = {},
): Promise<{ userId: string } | null> {
	if (!secret || !token || typeof token !== "string") {
		return null;
	}
	const parts = token.split(".");
	if (parts.length !== 2) {
		return null;
	}
	const [encodedPayload, providedSignature] = parts as [string, string];

	let expected: Uint8Array;
	let provided: Uint8Array;
	try {
		expected = await hmacSha256(secret, encodedPayload);
		provided = base64UrlToBytes(providedSignature);
	} catch {
		return null;
	}
	if (!timingSafeEqual(expected, provided)) {
		return null;
	}

	let payload: RaceTokenPayload;
	try {
		payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)));
	} catch {
		return null;
	}
	if (typeof payload?.sub !== "string" || typeof payload?.exp !== "number") {
		return null;
	}

	const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
	if (payload.exp < now) {
		return null;
	}
	return { userId: payload.sub };
}
