import type { TaskPriority, TaskStatus } from '@/types/database';

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'completed'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const DEFAULT_LIST_COLOR = '#6366F1';

export const DEFAULT_TAG_COLOR = '#64748B';

export const ORDER_INDEX_GAP = 65536;
