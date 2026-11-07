/** @type {import('next').NextConfig} */
const isDevCommand = process.argv.includes('dev');
const portIndex = process.argv.findIndex((arg) => arg === '-p' || arg === '--port');
const portFromArg = portIndex !== -1 ? process.argv[portIndex + 1] : undefined;
const activePort = isDevCommand ? (process.env.PORT || portFromArg) : undefined;

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
