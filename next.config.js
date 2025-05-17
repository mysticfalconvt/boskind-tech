/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  images: {
    domains: ["pbs.twimg.com", "cdn.sanity.io", "photos.rboskind.com", "localhost"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'boskind.tech',
        pathname: '/api/image/**',
      },
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
