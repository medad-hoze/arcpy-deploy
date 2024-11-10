/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // This is correct for static build
  // Remove distDir: 'build' as it can cause issues with static export
  reactStrictMode: true,
  images: {
    unoptimized: true  // Required for static export
  }
}

module.exports = nextConfig