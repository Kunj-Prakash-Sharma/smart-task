import { toast } from 'sonner';
import type { TaskStatus } from '@/types/database';

/**
 * Opens a task's linked external URL (Jira/Trello/etc.) in a new tab, but
 * only when the task is transitioning INTO "completed". Must be called
 * synchronously in the same call stack as the triggering user gesture,
 * before any `await` on the server action — window.open() after an awaited
 * round-trip loses "user activation" in most browsers and gets silently
 * popup-blocked.
 */
export function openExternalLinkIfCompleting(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
  externalUrl: string | null | undefined,
): void {
  if (nextStatus !== 'completed' || currentStatus === 'completed' || !externalUrl) return;

  const opened = window.open(externalUrl, '_blank', 'noopener,noreferrer');

  if (!opened) {
    toast.error("Linked task was blocked by your browser's pop-up blocker.", {
      action: {
        label: 'Open link',
        onClick: () => window.open(externalUrl, '_blank', 'noopener,noreferrer'),
      },
    });
  }
}
