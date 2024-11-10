/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // For static build
  distDir: 'build', // Build directory
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
