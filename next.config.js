/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  images: {
    domains: ["pbs.twimg.com", "cdn.sanity.io"],
  },
};

module.exports = nextConfig;
