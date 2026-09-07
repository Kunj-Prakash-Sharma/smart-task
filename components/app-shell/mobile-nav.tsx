'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  CalendarDays,
  Inbox,
  Folders,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ListRow } from '@/types/database';

interface MobileNavProps {
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

export function MobileNav({ lists }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu size={20} />
        </Button>
      </DialogTrigger>

      <DialogContent className="left-0 top-0 flex h-full w-72 max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-r p-0 shadow-xl">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold">TaskFlow</DialogTitle>
        </DialogHeader>

        <nav className="flex flex-col gap-0.5 px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const active = isPathActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <DialogClose key={item.href} asChild>
                <Link
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
              </DialogClose>
            );
          })}
        </nav>

        {lists.length > 0 && (
          <>
            <div className="mx-5 border-t" />
            <div className="flex flex-col gap-0.5 overflow-y-auto px-3 py-3">
              <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lists
              </span>
              {lists.map((list) => {
                const href = `/lists/${list.id}`;
                const active = pathname === href;

                return (
                  <DialogClose key={list.id} asChild>
                    <Link
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
                  </DialogClose>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-auto border-t px-3 py-3">
          <DialogClose asChild>
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
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
