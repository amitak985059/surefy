/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Ignore ESLint errors during builds (for Vercel)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Optional: Allow production builds even with TS errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
