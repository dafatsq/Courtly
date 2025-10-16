/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'
const apiPort = process.env.DEV_API_PORT || '8787'

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!isDev) return []
    return [
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${apiPort}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
