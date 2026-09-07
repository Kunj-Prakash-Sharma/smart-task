'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListTodo } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { SortableTask } from '@/components/tasks/sortable-task';
import { TaskCard } from '@/components/tasks/task-card';
import { STATUS_LABELS } from '@/lib/constants';
import type { TaskStatus, TaskWithTags } from '@/types/database';

export interface TaskColumnProps {
  status: TaskStatus;
  tasks: TaskWithTags[];
  onToggle: (taskId: string) => void;
  onSelect: (task: TaskWithTags) => void;
}

export function TaskColumn({ status, tasks, onToggle, onSelect }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h3 className="text-sm font-medium text-foreground">{STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState icon={ListTodo} title="No tasks" className="py-8" />
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
