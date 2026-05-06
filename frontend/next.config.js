/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://dclaw-network-backend:8132/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
