/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aromatic-clownfish-974.convex.cloud',
      },
    ],
  },
}

module.exports = nextConfig 