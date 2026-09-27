import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

// Protected pages that require authenticated user session
const protectedPageRoutes = [
  '/dashboard',
  '/plan-trip',
  '/my-trips',
  '/profile',
  '/chat',
  '/leaderboard',
];

// Auth pages that authenticated users should not visit
const authPageRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Protected API routes requiring valid JWT
const protectedApiPrefixes = [
  '/api/trips',
  '/api/users/stats',
  '/api/users/upload-profile',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Extract token from HTTP-only cookie or Authorization header
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Verify token
  const session = token ? await verifyAuthToken(token) : null;
  const isAuthenticated = !!session;

  // Strip any untrusted client-supplied identity headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-email');
  requestHeaders.delete('x-user-name');

  // 3. Handle Protected API Routes
  const isProtectedApi = protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtectedApi) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication token required' },
        { status: 401 }
      );
    }

    // Set verified identity headers for downstream route handlers
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-email', session.email);
    if (session.fullName) {
      requestHeaders.set('x-user-name', session.fullName);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. Handle Protected UI Pages
  const isProtectedPage = protectedPageRoutes.some((route) => pathname.startsWith(route));
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle Auth Pages (prevent logged-in users from seeing /login or /register)
  const isAuthPage = authPageRoutes.some((route) => pathname === route);
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 6. Pass through with verified headers if authenticated
  if (isAuthenticated) {
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-email', session.email);
    if (session.fullName) {
      requestHeaders.set('x-user-name', session.fullName);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};