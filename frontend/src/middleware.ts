import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * - /dashboard/* → requires sh_access cookie (student/admin)
 * - /employer/*  → requires sh_access cookie (employer/admin)
 * - /login       → redirect to dashboard if already authenticated
 *
 * NOTE: We can only check cookie *presence* here (edge runtime has no JWT lib).
 * Real token validity is enforced by the backend on every API call.
 * If the token is expired, apiFetch() will silently refresh via sh_refresh,
 * or redirect to /login if refresh also fails.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sh_access')?.value;
  const isAuthenticated = Boolean(accessToken);

  // Protect dashboard and employer routes
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/employer');

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the full path+query so the user lands back here after login
    const fullPath = pathname + (request.nextUrl.search || '');
    loginUrl.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from login
  // BUT if they arrived via a shared link redirect param, honour it
  if (pathname === '/login' && isAuthenticated) {
    const redirect = request.nextUrl.searchParams.get('redirect');
    const safeDest = redirect && redirect.startsWith('/') ? redirect : '/dashboard';
    return NextResponse.redirect(new URL(safeDest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/employer/:path*', '/login'],
};