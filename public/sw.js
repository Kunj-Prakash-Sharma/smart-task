// Minimal service worker. It exists purely to satisfy PWA installability
// criteria (Chrome/Android requires an active service worker with a fetch
// handler before it'll offer "Add to Home Screen"/"Install app").
//
// Deliberately does no caching: this app's data is live and auth-gated via
// Supabase, and caching responses here risks serving stale or cross-session
// content. If real offline support is wanted later, add an explicit,
// scoped cache strategy rather than growing this file ad hoc.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally empty: every request falls through to the network as if
  // no service worker were installed.
});
