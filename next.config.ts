import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/genizah", // Note: Leading slash is required by Next.js
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;