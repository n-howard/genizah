import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "genizah",
  output: "export",
  reactStrictMode: true,
};

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: 'tsconfig.json',
  },
}
