import { NextResponse, type NextRequest } from 'next/server';

/** Minimal middleware for debugging. */
export function middleware(request: NextRequest): NextResponse {
  return NextResponse.next();
}

/** Apply middleware to all routes except static assets and Next.js internals. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
