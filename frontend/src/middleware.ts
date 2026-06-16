import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * - /dashboard/* → requires sh_access cookie (student/admin)
 * - /employer/*  → requires sh_access cookie (employer/admin)
 * - /admin/*     → requires sh_access cookie + admin role (checked via API)
 * - /login       → redirect to dashboard if already authenticated
 *
 * NOTE: We can only check cookie *presence* here (edge runtime has no JWT lib).
 * Real token validity is enforced by the backend on every API call.
 * If the token is expired, apiFetch() will silently refresh via sh_refresh,
 * or redirect to /login if refresh also fails.
 * Admin role verification happens on the client side and via API 403s.
 */

/**
 * Validates a redirect destination is safe (same-origin, relative path only).
 * Rejects protocol-relative URLs like //evil.com which pass a naive startsWith('/') check.
 */
function isSafeRedirect(path: string | null): path is string {
  if (!path) return false;
  // Must start with / but NOT //  (protocol-relative URL attack)
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  // No embedded newlines (HTTP response splitting)
  if (/[\r\n]/.test(path)) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sh_access')?.value;
  const isAuthenticated = Boolean(accessToken);

  // Protect dashboard, employer, and admin routes
  const isProtected =
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/employer') ||
    pathname.startsWith('/admin');

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
    const safeDest = isSafeRedirect(redirect) ? redirect : '/dashboard';
    return NextResponse.redirect(new URL(safeDest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/employer/:path*', '/admin/:path*', '/login'],
};