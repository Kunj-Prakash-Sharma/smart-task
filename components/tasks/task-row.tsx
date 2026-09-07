'use client';

import { CalendarClock, ExternalLink, Repeat } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskTags } from '@/components/tasks/task-tags';
import { cn } from '@/lib/utils';
import { formatDueDate, isOverdue } from '@/lib/utils/dates';
import type { TaskWithTags } from '@/types/database';

export interface TaskRowProps {
  task: TaskWithTags;
  onToggle?: (taskId: string) => void;
  onClick?: () => void;
}

export function TaskRow({ task, onToggle, onClick }: TaskRowProps) {
  const isCompleted = task.status === 'completed';
  const dueDateLabel = formatDueDate(task.due_date);
  const overdue = isOverdue(task.due_date, task.completed_at);
  const tags = task.task_tags.map((taskTag) => taskTag.tags);

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 border-b py-2 last:border-b-0"
    >
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox checked={isCompleted} onCheckedChange={() => onToggle?.(task.id)} />
      </div>
      <p
        className={cn(
          'flex-1 truncate text-sm font-medium',
          isCompleted && 'text-muted-foreground line-through',
        )}
      >
        {task.title}
      </p>
      <TaskPriorityBadge priority={task.priority} />
      {task.is_recurring ? (
        <span title="Repeats every working day" className="shrink-0 text-muted-foreground">
          <Repeat size={13} />
        </span>
      ) : null}
      {task.external_url ? (
        <a
          href={task.external_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open linked task"
          onClick={(event) => event.stopPropagation()}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink size={13} />
        </a>
      ) : null}
      {dueDateLabel ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground',
            overdue && 'text-destructive',
          )}
        >
          <CalendarClock size={14} />
          {dueDateLabel}
        </span>
      ) : null}
      <div className="flex shrink-0 items-center gap-1.5">
        <TaskTags tags={tags} />
      </div>
    </div>
  );
}
