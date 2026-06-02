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
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from login
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/employer/:path*', '/login'],
};