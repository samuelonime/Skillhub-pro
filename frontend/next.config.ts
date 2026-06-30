import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from the external sources used in the app
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'img-c.udemycdn.com' },
      { protocol: 'https', hostname: 'www.udemy.com' },
      { protocol: 'https', hostname: 'd3njjcbhbojbot.cloudfront.net' },
      { protocol: 'https', hostname: 'coursera-course-photos.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'frontendmasters.com' },
      { protocol: 'https', hostname: 'www.vectorlogo.zone' },
      { protocol: 'https', hostname: 'vectorlogo.zone' },
      { protocol: 'https', hostname: 'meritlives.com' },
      { protocol: 'https', hostname: 'skillhub.meritlives.com' },
    ],
  },

  // ✅ ADD THIS: Proxy API requests to your backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
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
