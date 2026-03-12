import { useSession } from "@/lib/auth-client.ts";

export function useIsDevOrAdmin(): boolean {
	const { data: session } = useSession();
	const userRole = (session?.user as Record<string, unknown> | undefined)
		?.role as string | undefined;
	const hasRole = userRole === "dev" || userRole === "admin";
	// In local development, always allow debug access for signed-in users
	const isDev = process.env.NODE_ENV === "development";
	return hasRole || isDev;
}
