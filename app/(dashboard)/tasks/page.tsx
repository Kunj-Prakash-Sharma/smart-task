import { getLists } from '@/lib/data/lists';
import { getTasksForCurrentUser } from '@/lib/data/tasks';
import { TaskListClient } from './task-list-client';

export default async function TasksPage() {
  const [tasks, lists] = await Promise.all([getTasksForCurrentUser(), getLists()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} across {lists.length} list
          {lists.length === 1 ? '' : 's'}
        </p>
      </div>
      <TaskListClient initialTasks={tasks} />
    </div>
  );
}
