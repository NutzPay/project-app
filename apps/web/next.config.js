/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image configuration
  images: {
    unoptimized: true,
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirect root to dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // Proxy docs requests to Docusaurus
  async rewrites() {
    return [
      {
        source: '/docs/:path*',
        destination: 'http://localhost:3002/docs/:path*',
      },
    ];
  },

  // Environment variables exposed to client
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api/v1',
    DOCS_URL: process.env.DOCS_URL || 'http://localhost:3002',
  },
};

module.exports = nextConfig;