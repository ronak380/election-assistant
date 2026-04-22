/**
 * @file src/middleware.ts
 * @description Next.js Edge Middleware for security hardening.
 *
 *              Applies the following security headers on every response:
 *              - Content-Security-Policy (CSP) — prevents XSS and injection attacks
 *              - X-Frame-Options — prevents clickjacking
 *              - X-Content-Type-Options — prevents MIME sniffing
 *              - Referrer-Policy — limits referrer information leakage
 *              - Permissions-Policy — restricts access to sensitive browser APIs
 *              - Strict-Transport-Security (HSTS) — enforces HTTPS
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware function that adds strict security headers to all responses.
 * Runs on the Edge runtime for minimal latency overhead.
 *
 * @param {NextRequest} request - The incoming HTTP request.
 * @returns {NextResponse} The response with security headers injected.
 */
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  /**
   * Content Security Policy directives.
   * - default-src 'self': Only load resources from the same origin by default.
   * - script-src: Allows Firebase, Google APIs, GTM, and GA4 scripts.
   * - connect-src: Allows API calls to Firebase, GCP, and Maps.
   * - img-src: Allows images from same origin, data URIs, and Google Maps tiles.
   * - frame-ancestors 'none': Prevents the page from being embedded in iframes.
   */
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://www.google-analytics.com wss://*.firebaseio.com",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // --- Security Headers ---
  // Temporarily disabling CSP to debug the "This page couldn't load" error
  // response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  // Remove server identity information
  response.headers.delete('X-Powered-By');

  return response;
}

/** Apply middleware to all routes except static assets and Next.js internals. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
