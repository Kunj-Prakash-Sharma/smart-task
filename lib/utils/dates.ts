import {
  addDays,
  format,
  formatDistanceToNow,
  isPast,
  isThisWeek,
  isToday,
  isTomorrow,
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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Next date after `fromIso` (or after now, if omitted) whose day-of-week is
 * in `days` (0=Sunday..6=Saturday, i.e. Date#getDay()'s numbering),
 * preserving the original time-of-day. Used to schedule the next instance
 * of a recurring task. Returns null when `days` is empty (not recurring).
 */
export function nextRecurrenceDate(fromIso: string | null, days: number[]): Date | null {
  if (days.length === 0) return null;

  const daySet = new Set(days);
  let next = addDays(fromIso ? new Date(fromIso) : new Date(), 1);

  for (let i = 0; i < 7; i++) {
    if (daySet.has(next.getDay())) return next;
    next = addDays(next, 1);
  }

  return null; // unreachable when days.length > 0, keeps the function total
}

/** Human-readable summary of a recurrence day set, recognizing common presets. */
export function describeRecurrence(days: number[]): string {
  if (days.length === 0) return 'Does not repeat';

  const sorted = [...days].sort((a, b) => a - b);

  if (sorted.length === 7) return 'Repeats daily';
  if (sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d))) {
    return 'Repeats weekdays';
  }
  if (sorted.length === 2 && [0, 6].every((d) => sorted.includes(d))) {
    return 'Repeats weekends';
  }

  return `Repeats ${sorted.map((d) => DAY_LABELS[d]).join(', ')}`;
}
