'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  CalendarDays,
  Inbox,
  Folders,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';
import type { ListRow } from '@/types/database';

interface SidebarProps {
  lists: ListRow[];
}

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/today', label: 'Today', icon: CalendarCheck },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarDays },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/lists', label: 'Lists', icon: Folders },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function isPathActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ lists }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-card">
      <div className="px-5 py-5">
        <span className="text-lg font-semibold tracking-tight text-foreground">TaskFlow</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 my-3 border-t" />

      <div className="flex-1 overflow-y-auto px-3">
        {lists.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lists
            </span>
            {lists.map((list) => {
              const href = `/lists/${list.id}`;
              const active = pathname === href;

              return (
                <Link
                  key={list.id}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="truncate">{list.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 border-t px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isPathActive(pathname, '/settings')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings size={17} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
