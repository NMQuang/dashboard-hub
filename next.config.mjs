/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // turbopack ready
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
}

export default nextConfig
