import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: { root: process.cwd() },
  devIndicators: false,
};

export default nextConfig;
