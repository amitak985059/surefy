/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignore TypeScript build errors (optional)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
