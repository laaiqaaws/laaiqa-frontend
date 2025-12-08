import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication AND a specific role (artist/customer/admin)
const protectedRoutes = ['/admin', '/artist', '/customer', '/profile'];

// Routes that should redirect to dashboard if already authenticated with a valid role
// Note: signup is special - it's allowed for users with 'user' role to select their role
const authRoutes = ['/login', '/admin-login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated by verifying token exists
  const isAuthenticated = !!token;

  // For protected routes, redirect to login if not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For auth routes (except signup), redirect to callback if already authenticated
  if (authRoutes.some(route => pathname === route)) {
    if (isAuthenticated) {
      // Redirect to callback which will handle proper routing based on user role
      return NextResponse.redirect(new URL('/callback', request.url));
    }
  }

  // Special handling for signup - allow authenticated users with 'user' role
  // The page itself will handle redirecting users with valid roles
  if (pathname === '/signup') {
    // Let the page handle the logic - it checks if user needs to select role
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
