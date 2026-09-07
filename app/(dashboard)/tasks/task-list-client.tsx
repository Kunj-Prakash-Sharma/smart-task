'use client';

import { ListChecks, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskRow } from '@/components/tasks/task-row';
import { useOptimisticTasks } from '@/hooks/use-optimistic-tasks';
import { useTaskFilters } from '@/hooks/use-task-filters';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';
import type { TaskPriority, TaskStatus, TaskWithTags } from '@/types/database';

export interface TaskListClientProps {
  initialTasks: TaskWithTags[];
}

export function TaskListClient({ initialTasks }: TaskListClientProps) {
  const { tasks, toggle } = useOptimisticTasks(initialTasks);
  const { filtered, status, setStatus, priority, setPriority, search, setSearch } =
    useTaskFilters(tasks);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Tasks you create or that are assigned to you will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          data-search-input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks…"
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as TaskStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as TaskPriority | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-0.5 p-3">
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggle} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No matching tasks"
          description="Try adjusting your search or filters."
        />
      )}
    </div>
  );
}
