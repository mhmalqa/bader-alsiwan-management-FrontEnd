/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  async rewrites() {
    return [{ source: '/api/backend/:path*', destination: `${process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000'}/:path*` }]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
