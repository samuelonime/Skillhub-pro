import type { NextConfig } from "next";

// NOTE: /api/v1/* requests are handled by src/app/api/v1/[...path]/route.ts
// which proxies to BACKEND_URL at request time. No rewrite needed here.

const nextConfig: NextConfig = {
  // Allow images from the external sources used in the app
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;