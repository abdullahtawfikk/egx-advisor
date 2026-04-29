/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['technicalindicators']
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /yahoo-finance2/ })
    );
    return config;
  },
  async headers() {
    return [{ source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] }];
  }
};
export default nextConfig;
