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
    NEXT_PUBLIC_APP_NAME: 'nexus.hq',
  },
}

export default nextConfig
