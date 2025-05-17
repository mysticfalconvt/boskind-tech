/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  images: {
    domains: ["pbs.twimg.com", "cdn.sanity.io", "photos.rboskind.com", "localhost"],
  },
};

module.exports = nextConfig;
