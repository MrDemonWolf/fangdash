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
		NEXT_PUBLIC_PARTYKIT_HOST:
			process.env["NEXT_PUBLIC_PARTYKIT_HOST"] ||
			(process.env.NODE_ENV === "production"
				? "fangdash.nathanialhenniges.partykit.dev"
				: "localhost:1999"),
	},
};

export default nextConfig;
