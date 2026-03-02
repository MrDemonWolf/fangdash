import { createMDX } from "fumadocs-mdx/next";

const repoName = "fangdash";
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repoName}` : "",
};

const withMDX = createMDX();

export default withMDX(config);
