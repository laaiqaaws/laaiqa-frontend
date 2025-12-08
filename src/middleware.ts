import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication AND a specific role (artist/customer/admin)
const protectedRoutes = ['/admin', '/artist', '/customer', '/profile'];

// Routes that should redirect to dashboard if already authenticated with a valid role
const authRoutes = ['/login', '/admin-login'];

// Decode JWT to get user role (lightweight check without full verification)
function decodeToken(token: string): { role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

// Get the correct dashboard route for a role
function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'artist': return '/artist';
    case 'customer': return '/customer';
    default: return '/signup';
  }
}

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
  const tokenPayload = token ? decodeToken(token) : null;
  const userRole = tokenPayload?.role;
  const hasValidRole = userRole && ['artist', 'customer', 'admin'].includes(userRole);

  // For protected routes, redirect to login if not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role-based access
    if (hasValidRole) {
      // Admin trying to access non-admin routes
      if (userRole === 'admin' && !pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      // Artist trying to access customer routes
      if (userRole === 'artist' && pathname.startsWith('/customer')) {
        return NextResponse.redirect(new URL('/artist', request.url));
      }
      // Customer trying to access artist routes
      if (userRole === 'customer' && pathname.startsWith('/artist')) {
        return NextResponse.redirect(new URL('/customer', request.url));
      }
      // Profile routes - allow access to own profile
      if (pathname.startsWith('/profile')) {
        // /profile/artist should only be accessible by artists
        if (pathname.startsWith('/profile/artist') && userRole !== 'artist') {
          return NextResponse.redirect(new URL(`/profile/${userRole}`, request.url));
        }
        // /profile/customer should only be accessible by customers
        if (pathname.startsWith('/profile/customer') && userRole !== 'customer') {
          return NextResponse.redirect(new URL(`/profile/${userRole}`, request.url));
        }
      }
    } else if (isAuthenticated && userRole === 'user') {
      // User with 'user' role trying to access protected routes - redirect to signup
      return NextResponse.redirect(new URL('/signup', request.url));
    }
  }

  // For auth routes (login, admin-login), redirect to dashboard if already authenticated with valid role
  if (authRoutes.some(route => pathname === route)) {
    if (isAuthenticated && hasValidRole) {
      return NextResponse.redirect(new URL(getDashboardRoute(userRole!), request.url));
    }
    // If authenticated but no valid role, redirect to signup
    if (isAuthenticated && userRole === 'user') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
  }

  // Signup page - redirect if already has valid role
  if (pathname === '/signup') {
    if (isAuthenticated && hasValidRole) {
      return NextResponse.redirect(new URL(getDashboardRoute(userRole!), request.url));
    }
    // Allow access for unauthenticated or 'user' role
    return NextResponse.next();
  }

  // Callback page - let it handle the routing logic
  if (pathname === '/callback') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
