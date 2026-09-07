import { ListTodo } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { getLists } from '@/lib/data/lists';
import { getTasksForCurrentUser } from '@/lib/data/tasks';
import { TaskListClient } from './task-list-client';

export default async function TasksPage() {
  const [tasks, lists] = await Promise.all([getTasksForCurrentUser(), getLists()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListTodo}
        title="Tasks"
        description={`${tasks.length} task${tasks.length === 1 ? '' : 's'} across ${lists.length} list${lists.length === 1 ? '' : 's'}`}
      />
      <TaskListClient initialTasks={tasks} />
    </div>
  );
}
