/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Webpack configuration for Prisma Client
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common')
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Handle Prisma Client
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    return config
  },
  
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