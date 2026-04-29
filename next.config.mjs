/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['technicalindicators', 'yahoo-finance2']
  },
  webpack: (config) => {
    // yahoo-finance2 ESM build imports a test-only helper that doesn't exist at build time
    config.resolve.alias['@gadicc/fetch-mock-cache/stores/fs.ts'] =