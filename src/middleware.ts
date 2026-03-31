import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Reserved paths that should NOT be treated as salon slugs
  const reservedPaths = [
    'admin',
    'superadmin',
    'api',
    '_next',
    'favicon.ico',
    'login',
    'register',
    'catalogo', // We keep the original route accessible just in case
    'salon',     // Avoid conflicts if there are other salon routes
    'profesional' // Dashboard for staff
  ];

  // Logic: if pathname is "/something" and "something" is NOT in reservedPaths
  // and it's not the root "/", we treat it as a salon slug.
  
  const pathParts = pathname.split('/').filter(Boolean);
  
  if (pathParts.length === 1) {
    const slug = pathParts[0];
    
    if (!reservedPaths.includes(slug)) {
      // Internal rewrite: /salon-id -> /catalogo/salon-id
      return NextResponse.rewrite(new URL(`/catalogo/${slug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|pics|.*\\..*).*)',
  ],
};
