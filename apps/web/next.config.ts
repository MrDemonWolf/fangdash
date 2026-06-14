import type { NextConfig } from "next";

const partykitHost =
	process.env["NEXT_PUBLIC_PARTYKIT_HOST"] ||
	(process.env.NODE_ENV === "production"
		? "fangdash.nathanialhenniges.partykit.dev"
		: "localhost:1999");

const connectSrc = [
	"'self'",
	process.env["NEXT_PUBLIC_API_URL"],
	`wss://${partykitHost}`,
	`https://${partykitHost}`,
]
	.filter(Boolean)
	.join(" ");

const contentSecurityPolicy = [
	"default-src 'self'",
	// 'unsafe-inline' for script-src is required by Next.js inline hydration absent nonce infra
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://static-cdn.jtvnw.net",
	"font-src 'self' data:",
	`connect-src ${connectSrc}`,
	"worker-src 'self'",
	"frame-ancestors 'none'",
].join("; ");

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
					// Skipped in dev so next dev HMR (eval, inline ws) keeps working
					...(process.env.NODE_ENV === "production"
						? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]
						: []),
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
		NEXT_PUBLIC_COMMIT_SHA: (() => {
			const sha = process.env["COMMIT_SHA"] ?? process.env["VERCEL_GIT_COMMIT_SHA"];
			if (sha) return sha.slice(0, 7);
			// In dev, show git branch + short SHA
			try {
				const { execSync } = require("node:child_process");
				const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
				const shortSha = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
				return `${branch}@${shortSha}`;
			} catch {
				return "dev";
			}
		})(),
		NEXT_PUBLIC_PARTYKIT_HOST: partykitHost,
	},
};

export default nextConfig;
