/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // yahoo-finance2 ESM types emit false-positive this-context errors; runtime is fine
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['technicalindicators', 'yahoo-finance2']
  },
  webpack: (config, { webpack }) => {
    const testDeps = [
      '@gadicc/fetch-mock-cache',
      '@gadicc/fetch-mock-cache/stores/fs.ts',
      '@std/testing/mock',
      '@std/testing/bdd',
      '@std/testing',
    ];
    for (const dep of testDeps) {
      config.resolve.alias[dep] = false;
    }
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /yahoo-finance2\/esm\/tests/,
      })
    );
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
