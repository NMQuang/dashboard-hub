/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // turbopack ready
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
  // Proxy env vars to client selectively
  env: {
    NEXT_PUBLIC_APP_NAME: 'dashboard-hub.hq',
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? '',
  },
  // Exclude heavy build-time binaries from function bundles.
  // @swc/core Linux binaries are 100-150 MB and get incorrectly traced
  // into serverless functions, causing the 250 MB limit to be exceeded.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu/**/*',
      'node_modules/@swc/core-linux-x64-musl/**/*',
      'node_modules/@swc/core-darwin-x64/**/*',
      'node_modules/@swc/core-darwin-arm64/**/*',
      'node_modules/@esbuild/**/*',
      'node_modules/webpack/**/*',
      'node_modules/rollup/**/*',
      'node_modules/terser/**/*',
    ],
  },
}

export default nextConfig
