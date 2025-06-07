/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
  // Disable HTTP Keep-Alive to prevent connection pooling issues
  httpAgentOptions: {
    keepAlive: false,
  },
}

module.exports = nextConfig 