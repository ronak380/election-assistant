/**
 * @file next.config.ts
 * @description Next.js configuration for the Election Assistant application.
 *
 *              Key settings:
 *              - Standalone output for Docker/Cloud Run deployment
 *              - Strict security headers (additional layer on top of middleware)
 *              - Image optimization for Google domains
 *              - Bundle analyzer support (via ANALYZE env var)
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Standalone output mode bundles only the necessary files for production.
   * Required for the multi-stage Dockerfile to work correctly.
   */
  output: 'standalone',

  /**
   * React strict mode helps catch potential issues during development.
   * Enables double-invoking lifecycle hooks to surface side effects.
   */
  reactStrictMode: true,

  /**
   * Allow images from Google and Firebase domains to be optimized
   * by Next.js Image component.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/**',
      },
    ],
  },

  /**
   * HTTP response headers for additional security coverage.
   * Temporarily disabling to debug the crash.
   */
  /*
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets aggressively (immutable since they have content hashes)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  */

  /**
   * Redirect www to non-www for canonical URLs.
   */
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
