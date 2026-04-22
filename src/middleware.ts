import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — Security Headers and CSP
 *
 * This middleware applies security headers to all responses and implements
 * a Content Security Policy (CSP) to mitigate XSS and injection attacks.
 */
export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // CSP: Allow GTM, GA4, Firebase, and Google Fonts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://*.firebaseapp.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://maps.googleapis.com https://www.googletagmanager.com https://*.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.google-analytics.com https://vortexai.googleapis.com;
    frame-src 'self' https://*.firebaseapp.com https://www.googletagmanager.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('content-security-policy', cspHeader);
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

/** Apply middleware to all routes except static assets and Next.js internals. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
