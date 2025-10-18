import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Ignore ESLint errors during builds on Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
