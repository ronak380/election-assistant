import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — Security Headers and CSP
 *
 * This middleware applies security headers to all responses and implements
 * a Content Security Policy (CSP) to mitigate XSS and injection attacks.
 */
export function middleware(request: NextRequest): NextResponse {
  // Temporarily disabling CSP to debug Navbar crash
  return NextResponse.next();
}

/** Apply middleware to all routes except static assets and Next.js internals. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
