'use client';

import { TaskRow } from '@/components/tasks/task-row';
import { useOptimisticTasks } from '@/hooks/use-optimistic-tasks';
import type { TaskWithTags } from '@/types/database';

export interface InboxTaskListProps {
  initialTasks: TaskWithTags[];
}

export function InboxTaskList({ initialTasks }: InboxTaskListProps) {
  const { tasks, toggle } = useOptimisticTasks(initialTasks);

  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={toggle} />
      ))}
    </div>
  );
}
