import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
	transpilePackages: ["@fangdash/shared", "@fangdash/game"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "static-cdn.jtvnw.net",
				pathname: "/jtv_user_pictures/**",
			},
		],
	},
	env: {
		NEXT_PUBLIC_APP_VERSION: process.env["npm_package_version"] ?? "0.0.0",
		NEXT_PUBLIC_COMMIT_SHA: (
			process.env["COMMIT_SHA"] ??
			process.env["VERCEL_GIT_COMMIT_SHA"] ??
			"dev"
		).slice(0, 7),
		NEXT_PUBLIC_PARTYKIT_HOST:
			process.env["NEXT_PUBLIC_PARTYKIT_HOST"] ||
			(process.env.NODE_ENV === "production"
				? "fangdash.nathanialhenniges.partykit.dev"
				: "localhost:1999"),
	},
};

export default nextConfig;
