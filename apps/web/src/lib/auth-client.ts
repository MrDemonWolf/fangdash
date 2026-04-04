import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env["NEXT_PUBLIC_API_URL"];
if (!baseURL) {
	throw new Error("NEXT_PUBLIC_API_URL is required for auth client");
}

export const authClient = createAuthClient({
	baseURL,
	plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

export function signInWithTwitch(opts?: { preservePath?: boolean }) {
	const callbackURL = opts?.preservePath ? window.location.href : window.location.origin;
	void signIn.social({ provider: "twitch", callbackURL });
}
