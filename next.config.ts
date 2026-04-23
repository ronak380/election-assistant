/**
 * @file next.config.ts
 * @description Next.js configuration for the Election Assistant application.
 *
 *              Key settings:
 *              - Standalone output for Docker/Cloud Run deployment
 *              - Security headers (additional layer on top of middleware CSP)
 *              - Aggressive caching for static assets
 *              - Image optimization for Google domains
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Standalone output mode bundles only the necessary files for production.
   * Required for the multi-stage Dockerfile to work correctly with Cloud Run.
   */
  output: 'standalone',

  /**
   * React strict mode helps catch potential issues during development.
   * Enables double-invoking lifecycle hooks to surface side effects.
   */
  reactStrictMode: true,

  /**
   * Allow images from Google and Firebase domains to be optimised
   * by the Next.js Image component.
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
   * HTTP response headers for security and performance.
   * These complement the CSP set in middleware.ts with caching and framing rules.
   */
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
        // Cache static assets aggressively — they have content hashes so immutable is safe
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Short-lived cache for HTML pages (always revalidate)
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  /**
   * Redirect /home to / for canonical URL consistency.
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
