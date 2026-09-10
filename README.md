# TaskFlow

A task manager built with Next.js and Supabase — lists and boards, recurring tasks, a focus-timer widget with real Picture-in-Picture support, analytics, and an installable PWA (including iOS).

## Features

- **Lists & boards** — organize tasks into lists, view them as a drag-and-drop kanban board or a filterable list
- **Recurring tasks** — mark a task to repeat every working day
- **External links** — connect a task to a card/issue in another tool (Jira, Trello, etc.); completing the task opens the link automatically
- **Focus timer widget** — start focusing on a task from anywhere in the app; pops into an always-on-top floating window (via the Document Picture-in-Picture API) with play/pause/next/done controls and its own quick "+ Add" task capture
- **Command palette** — `⌘K`/`Ctrl+K` to jump to any page or list, or create a task
- **Analytics** — focus time, priority breakdown, completion velocity, created-vs-completed
- **Light/dark mode** — system-aware, with a manual toggle
- **Installable PWA** — "Add to Home Screen" on iOS, installable on Android/desktop

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router, Server Actions, Server Components) + React 19 + TypeScript
- [Supabase](https://supabase.com) (Postgres, Row Level Security, Auth)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [dnd-kit](https://dndkit.com) for drag-and-drop, [Recharts](https://recharts.org) for analytics
- [Zod](https://zod.dev) for validation

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then copy the environment template:

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from **Project Settings → API** in your Supabase dashboard.

### 3. Run the database migrations

Apply the SQL files in `supabase/migrations/` **in order**, either via the Supabase SQL Editor (paste and run each file) or the Supabase CLI:

```bash
supabase db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | Description                     |
| --------------------- | -------------------------------- |
| `npm run dev`         | Start the development server     |
| `npm run build`       | Production build                 |
| `npm run start`       | Run the production build         |
| `npm run typecheck`   | Type-check with `tsc --noEmit`   |
| `npm run lint`        | Lint with `next lint`            |

## Project structure

```
app/                  Routes (App Router) — (auth) and (dashboard) route groups
components/
  ui/                 shadcn/ui primitives
  app-shell/           Sidebar, topbar, command palette
  tasks/, lists/       Feature components
  analytics/           Chart widgets
  shared/               Cross-page components (empty states, dialogs, etc.)
hooks/                  Client-side hooks, incl. the focus-timer widget
lib/
  actions/              Server Actions (mutations)
  data/                 Server-side data fetchers (reads)
  validators/           Zod schemas
  supabase/              Supabase client setup
supabase/migrations/    SQL migrations, applied in order
```

See `CLAUDE.md` for architecture notes and conventions worth knowing before making changes.
