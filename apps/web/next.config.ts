import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fangdash/shared", "@fangdash/game"],
};

export default nextConfig;
