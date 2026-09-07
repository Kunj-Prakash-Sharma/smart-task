import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  CalendarDays,
  Inbox,
  Folders,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/today', label: 'Today', icon: CalendarCheck },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarDays },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/lists', label: 'Lists', icon: Folders },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function isPathActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
