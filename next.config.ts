import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Apply subpath ONLY during production builds (GitHub Pages)
  basePath: isProd ? "/genizah" : "",
  assetPrefix: isProd ? "/genizah" : "",
  
  reactStrictMode: false,
  
  output: "export",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    unoptimized: true, // Required for static exports
  },
};

export default nextConfig;