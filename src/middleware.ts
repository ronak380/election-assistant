import { NextResponse, type NextRequest } from 'next/server';

/**
 * @file src/middleware.ts
 * @description Next.js Edge Middleware — Security Headers & Content Security Policy
 *
 *              Applies hardened HTTP security headers to every response to mitigate:
 *              - XSS via strict CSP directives
 *              - Clickjacking via X-Frame-Options
 *              - MIME sniffing via X-Content-Type-Options
 *              - Information leakage via Referrer-Policy
 *
 *              CSP allows only the external domains explicitly used by this app:
 *              Google Fonts, Google Maps, Firebase, Google Analytics/GTM.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // --- Content Security Policy ---
  // Domains are carefully scoped to only what this app actually uses.
  const csp = [
    // Default: only same-origin
    `default-src 'self'`,

    // Scripts: self + GTM + GA4 + Maps JS + Firebase
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://apis.google.com`,

    // Styles: self + Google Fonts
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // Fonts: self + Google Fonts CDN
    `font-src 'self' https://fonts.gstatic.com`,

    // Images: self + Google user content (auth avatars) + Maps tiles + data URIs
    `img-src 'self' data: blob: https://*.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com`,

    // Connections: self + Gemini API + Firebase + GA4 + Maps
    `connect-src 'self' https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://analytics.google.com https://fcm.googleapis.com`,

    // Frames: deny all (no iframes needed)
    `frame-src 'none'`,

    // Objects: block all plugins
    `object-src 'none'`,

    // Base URI: only self
    `base-uri 'self'`,

    // Form submissions: only self
    `form-action 'self'`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // --- Framing Protection ---
  response.headers.set('X-Frame-Options', 'DENY');

  // --- MIME Sniffing Protection ---
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // --- Referrer Policy ---
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // --- Permissions Policy — restrict dangerous browser APIs ---
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(self), camera=(), microphone=(), payment=()'
  );

  // --- DNS Prefetch for performance ---
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

/** Apply middleware to all routes except static assets and Next.js internals. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
