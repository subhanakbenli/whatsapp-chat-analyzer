/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Enable Server Components
    serverComponentsExternalPackages: ['pg', '@neondatabase/serverless'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Ignore specific modules that cause issues
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    
    return config;
  },
  
  // Headers for security
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/analyze',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ];
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Production optimizations
  swcMinify: true,
  
  // Custom build configuration
  distDir: '.next',
  
  // Asset optimization
  optimizeFonts: true,
  optimizeImages: true,
  
  // Bundle analyzer (for development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './bundle-analyzer.html',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;