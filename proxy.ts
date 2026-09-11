import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin/* routes (except /admin/login)
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const hasAuthCookie = request.cookies.getAll().some((c) =>
      c.name.includes('sb-') && c.name.includes('-auth-token')
    );

    if (!hasAuthCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
  }

  // Refresh Supabase session if needed
  const response = createClient(request);

  // Security Headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.sanity.io;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com;
    img-src 'self' data: blob: cdn.sanity.io api.dicebear.com *.supabase.co *.googleusercontent.com;
    font-src 'self' fonts.gstatic.com;
    connect-src 'self' *.supabase.co cdn.sanity.io *.sanity.io;
    frame-ancestors 'self';
    object-src 'none';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
