/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PORT ? `.next-${process.env.PORT}` : '.next',
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      }
    ],
  },
};

module.exports = nextConfig;
