# TaskFlow

A task manager built on Next.js 15 (App Router) + Supabase. Boards, lists, recurring tasks, a focus-timer widget (with real Document Picture-in-Picture support), analytics, and a PWA install path (including iOS).

## Stack

- Next.js 15.1 (App Router, Server Actions, Server Components), React 19, TypeScript (strict)
- Supabase: Postgres, RLS, `SECURITY DEFINER` RPCs, Auth (via `@supabase/ssr`)
- Tailwind v3.4 + shadcn/ui (`new-york` style, `slate` base color — see `components.json`), `tailwindcss-animate`
- dnd-kit (board drag-and-drop), recharts (analytics), `next-themes` (dark mode), Geist/Geist Mono fonts
- Zod for all Server Action input validation

## Commands

```
npm run dev         # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint          # next lint
```

Always run `npm run typecheck && npm run build` after a change before calling it done — this is the project's established verification bar; there's no test suite.

## Environment

Copy `.env.local.example` to `.env.local` and fill in the Supabase project URL + publishable key. Migrations in `supabase/migrations/` (run in order via the Supabase SQL Editor or `supabase db push`) are not applied automatically — after adding a new migration file, you must tell the user to run it against their live project; there's no CI/automation that does this.

## Architecture conventions

- **Server Actions** live in `lib/actions/*.ts` (`'use server'`), **data fetchers** (server-side reads) in `lib/data/*.ts`, **Zod schemas** in `lib/validators/*.ts`. Actions return `ActionResult<T>` (`{ok:true,data}` / `{ok:false,error}`) via `lib/utils/errors.ts`, never throw to the client.
- **Insert-then-separate-fetch, not `.insert().select()`**: Postgres RLS re-checks the SELECT policy on `INSERT ... RETURNING`, which breaks for self-referential policies (e.g. a list's SELECT policy that calls a function querying the same table). Every create/update action does a plain `.insert(...)`/`.update(...)` with no `.select()` chained, then a separate `.select('*').eq('id', id).single()` call. Follow this pattern for any new mutation.
- **`lib/supabase/mutable.ts`**: a deliberate `(client: unknown) => any` escape hatch around a real postgrest-js typing bug where `.insert()/.update()/.rpc()` (and some `.select()` chains) collapse to `never` against the hand-written `Database` type. Used throughout `lib/actions/*`. Don't try to "fix" the types instead — this was investigated at length; the cast is the accepted fix.
- **`components/ui/*`**: hand-picked shadcn primitives. Some (separator, scroll-area, sheet, command, sidebar) were pulled via `npx shadcn add <name>` using the hand-authored `components.json`; the rest were hand-built before that and have no CLI provenance. When adding a new shadcn component, decline any prompt to overwrite an existing file in `components/ui/*` unless you've diffed it first.
- **dnd-kit board** (`components/tasks/task-board.tsx`): has two non-obvious fixes, do not remove — `PointerSensor` needs `activationConstraint: {distance: 8}` (without it, drag swallows plain clicks on a card) and `<DndContext>` is gated behind a post-mount `useState` flag (dnd-kit's internal aria-describedby id counter differs between SSR and hydration otherwise, causing a hydration mismatch warning).
- **Focus-timer widget** (`hooks/use-live-task.tsx`): renders into an actual separate browser window via `window.documentPictureInPicture`. That window has its own `document` with no Tailwind stylesheet — the `floating` render branch uses only plain CSS classes from the `PIP_STYLES` string (not Tailwind utilities), and deliberately avoids the `light-dark()` CSS function (dropped silently on Chrome versions that support PiP but predate it). A `TaskCreateDialog` triggered from inside the PiP branch still portals its own dialog into the *main* window's document (Radix defaults to `document.body` of the opener) — this is intentional, not a bug.
- **Middleware** (`middleware.ts` + `lib/supabase/proxy.ts`): redirects unauthenticated requests to `/login` for anything not in `PUBLIC_ROUTE_PREFIXES`, and the matcher itself excludes static assets. If you add a new file-based route that must be reachable without auth (like `manifest.webmanifest`/`sw.js` were), extend the matcher's negative lookahead — don't add it to `PUBLIC_ROUTE_PREFIXES`, which is for real pages.
- **PWA**: `app/manifest.ts` (file-convention manifest route), `app/icon.png`/`app/apple-icon.png` (file-convention head tags), `public/icons/*` (explicit manifest icon sizes/purposes), `public/sw.js` (deliberately a no-op service worker — no caching, since data is live/auth-gated via Supabase and stale caches would be worse than no offline support).

## Things not to do

- Don't re-run `shadcn init` — it would overwrite `app/globals.css`'s theme tokens (including the non-standard `--success`/`--warning` variables) with the defaults.
- Don't add caching logic to `public/sw.js` without thinking through auth/session staleness first.
- Don't change `queueRef` in `hooks/use-live-task.tsx` to re-derive from the `todayTasks` prop — it's an intentional one-time snapshot; every place that needs to change it (`goToNext`, `markDone`, `stopFocus`, the widget's own quick-add) mutates the ref directly.
