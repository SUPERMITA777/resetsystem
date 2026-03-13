import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Define the main domain (adjustment needed for production)
  const mainDomain = 'resetsystem.vercel.app';
  const isLocalhost = host.includes('localhost');

  // Skip if it's a direct IP or doesn't match the pattern we want
  if (!host.includes(mainDomain) && !isLocalhost) {
    return NextResponse.next();
  }

  // Extract the subdomain
  let subdomain = '';
  if (isLocalhost) {
    // For local testing: if host is salon.localhost:3000
    const parts = host.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
        subdomain = parts[0];
    }
  } else {
    // For production: [sub].resetsystem.vercel.app
    const parts = host.split('.');
    // parts would be [sub, resetsystem, vercel, app] -> length 4
    if (parts.length >= 4) {
      subdomain = parts[0];
    }
  }

  // If there's a subdomain and it's not 'www' or 'admin' or 'superadmin'
  const reservedSubdomains = ['www', 'admin', 'superadmin'];
  if (subdomain && !reservedSubdomains.includes(subdomain)) {
    // Rewrite path to /catalogo/[subdomain]
    // If user is at salon.resetsystem.vercel.app/catalogo -> we rewrite to /catalogo/salon
    if (url.pathname === '/catalogo' || url.pathname === '/catalogo/') {
      return NextResponse.rewrite(new URL(`/catalogo/${subdomain}`, request.url));
    }
    
    // If they go to the root of the subdomain: salon.resetsystem.vercel.app/
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/catalogo/${subdomain}`, request.url));
    }
  }

  return NextResponse.next();
}

// Config to specify which paths the middleware should run on
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
