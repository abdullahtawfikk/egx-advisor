/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['technicalindicators', 'yahoo-finance2']
  },
  webpack: (config) => {
    config.resolve.alias['@gadicc/fetch-mock-cache/stores/fs.ts'] = false;
    config.resolve.alias['@gadicc/fetch-mock-cache'] = false;
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }]
      }
    ];
  }
};
export default nextConfig;
