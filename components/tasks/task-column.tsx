'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListTodo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { SortableTask } from '@/components/tasks/sortable-task';
import { TaskCard } from '@/components/tasks/task-card';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/constants';
import type { TaskStatus, TaskWithTags } from '@/types/database';

export interface TaskColumnProps {
  status: TaskStatus;
  tasks: TaskWithTags[];
  onToggle: (taskId: string) => void;
  onSelect: (task: TaskWithTags) => void;
}

export function TaskColumn({ status, tasks, onToggle, onSelect }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</h3>
        <Badge variant="secondary" className="font-mono">
          {tasks.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-2 pt-0 transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState icon={ListTodo} title="No tasks" className="border-none py-8" />
          ) : (
            tasks.map((task) => (
              <SortableTask key={task.id} id={task.id}>
                <TaskCard task={task} onToggle={onToggle} onClick={() => onSelect(task)} />
              </SortableTask>
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
