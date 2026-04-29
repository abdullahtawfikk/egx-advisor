/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['technicalindicators', 'yahoo-finance2']
  },
  webpack: (config, { webpack }) => {
    // yahoo-finance2 ESM build drags in Deno/test-only deps at build time — stub them all out
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
    // Also ignore the entire yahoo-finance2 test directory
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
