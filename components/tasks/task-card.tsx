'use client';

import { CalendarClock, ExternalLink, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskTags } from '@/components/tasks/task-tags';
import { cn } from '@/lib/utils';
import { describeRecurrence, formatDueDate, isOverdue } from '@/lib/utils/dates';
import type { TaskWithTags } from '@/types/database';

export interface TaskCardProps {
  task: TaskWithTags;
  onToggle?: (taskId: string) => void;
  onClick?: () => void;
}

export function TaskCard({ task, onToggle, onClick }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const dueDateLabel = formatDueDate(task.due_date);
  const overdue = isOverdue(task.due_date, task.completed_at);
  const tags = task.task_tags.map((taskTag) => taskTag.tags);

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        isCompleted && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
          <Checkbox checked={isCompleted} onCheckedChange={() => onToggle?.(task.id)} />
        </div>
        <p
          className={cn(
            'flex-1 text-sm font-medium leading-snug',
            isCompleted && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-6">
        <TaskPriorityBadge priority={task.priority} />
        {task.recurrence_days?.length > 0 ? (
          <span title={describeRecurrence(task.recurrence_days)} className="text-muted-foreground">
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
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={13} />
          </a>
        ) : null}
        {dueDateLabel ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground',
              overdue && 'font-medium text-destructive',
            )}
          >
            <CalendarClock size={14} />
            {dueDateLabel}
          </span>
        ) : null}
        <TaskTags tags={tags} />
      </div>
    </Card>
  );
}
