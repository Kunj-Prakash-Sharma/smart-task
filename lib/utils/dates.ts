import {
  addDays,
  format,
  formatDistanceToNow,
  isPast,
  isThisWeek,
  isToday,
  isTomorrow,
  isWeekend,
} from 'date-fns';

export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) {
    return null;
  }

  const date = new Date(dueDate);

  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }

  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE, h:mm a');
  }

  return format(date, 'MMM d, yyyy');
}

export function isOverdue(dueDate: string | null, completedAt: string | null): boolean {
  if (!dueDate || completedAt) {
    return false;
  }

  return isPast(new Date(dueDate));
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function toDateInputValue(date: string | null): string {
  if (!date) {
    return '';
  }

  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

/**
 * Next Mon-Fri after `fromIso` (or after now, if omitted), preserving the
 * original time-of-day. Used to schedule the next instance of a task
 * marked "repeat every working day".
 */
export function nextWorkingDay(fromIso: string | null): Date {
  let next = addDays(fromIso ? new Date(fromIso) : new Date(), 1);

  while (isWeekend(next)) {
    next = addDays(next, 1);
  }

  return next;
}
