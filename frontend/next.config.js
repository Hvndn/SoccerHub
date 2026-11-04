/** @type {import('next').NextConfig} */
const portIndex = process.argv.findIndex((arg) => arg === '-p' || arg === '--port');
const portFromArg = portIndex !== -1 ? process.argv[portIndex + 1] : undefined;
const activePort = process.env.PORT || portFromArg;

const nextConfig = {
  distDir: activePort ? `.next-${activePort}` : '.next',
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
