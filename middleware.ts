import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // manifest.webmanifest and sw.js aren't pages -- they're static PWA
    // assets the OS/browser fetches to evaluate installability and register
    // the service worker, sometimes before the user is authenticated (e.g.
    // from the login screen). Redirecting them to /login like a real page
    // would silently break both.
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
