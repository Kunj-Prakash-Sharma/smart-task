'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { TaskRow } from '@/components/tasks/task-row';
import { useOptimisticTasks } from '@/hooks/use-optimistic-tasks';
import type { TaskWithTags } from '@/types/database';

export interface UpcomingTaskListProps {
  initialTasks: TaskWithTags[];
}

interface TaskGroup {
  dateKey: string;
  label: string;
  tasks: TaskWithTags[];
}

function groupTasksByDay(tasks: TaskWithTags[]): TaskGroup[] {
  const groups = tasks.reduce((acc, task) => {
    if (!task.due_date) {
      return acc;
    }

    const date = new Date(task.due_date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const existing = acc.get(dateKey);

    if (existing) {
      existing.tasks.push(task);
    } else {
      acc.set(dateKey, { dateKey, label: format(date, 'EEEE, MMMM d'), tasks: [task] });
    }

    return acc;
  }, new Map<string, TaskGroup>());

  return Array.from(groups.values());
}

export function UpcomingTaskList({ initialTasks }: UpcomingTaskListProps) {
  const { tasks, toggle } = useOptimisticTasks(initialTasks);
  const groups = groupTasksByDay(tasks);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.dateKey} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
          <Card>
            <CardContent className="p-4">
              {group.tasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggle} />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
