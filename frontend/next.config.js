/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://dclaw-network-backend:8044'
    return [
      { source: '/health/:path*', destination: `${backend}/health/:path*` },
      { source: '/api/:path*',    destination: `${backend}/api/:path*` },
    ]
  },
}

module.exports = nextConfig
