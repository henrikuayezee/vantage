import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/accept-invite'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isPublic) return NextResponse.next();

  // Access token lives in memory (Zustand), not cookies, so we can't verify it here.
  // We use a lightweight "isLoggedIn" cookie set by the client on successful login
  // purely as a redirect signal — not a security boundary (the API enforces that).
  const isLoggedIn = request.cookies.has('vantage_session');
  if (!isLoggedIn && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
