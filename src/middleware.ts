import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/trips', '/leaderboard'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the user data from the session cookie
  const userCookie = request.cookies.get('user');
  let userId = null;

  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie.value);
      if (userData._id) {
        userId = userData._id;
      }
    } catch (error) {
      // If there's an error parsing the cookie, clear it
      const response = NextResponse.next();
      response.cookies.delete('user');
      return response;
    }
  }

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!userId) {
      // Redirect to login if trying to access protected route without auth
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Handle auth routes (login/register)
  if (authRoutes.includes(pathname)) {
    if (userId) {
      // Redirect to dashboard if trying to access auth routes while logged in
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Clone the response and add user ID to headers if authenticated
  const response = NextResponse.next();
  if (userId) {
    response.headers.set('user-id', userId);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 