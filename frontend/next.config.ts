import type { NextConfig } from "next";

// BACKEND_URL = root URL of your deployed backend (no trailing slash, no /api/v1)
// e.g. https://skillhub-api.onrender.com
// Set this in Vercel env vars (server-side only, NOT NEXT_PUBLIC_).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  // Proxy /api/v1/* → backend so cookies are same-origin in both dev and prod
  async rewrites() {
    return [
      {
        source:      '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },

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