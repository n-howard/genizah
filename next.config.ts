import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/genizah", // Note: Leading slash is required by Next.js
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required when using output: 'export'
  },
 
};

export default nextConfig;