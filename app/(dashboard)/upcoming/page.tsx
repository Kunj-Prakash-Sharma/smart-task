import { CalendarRange } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { getUpcomingTasks } from '@/lib/data/tasks';
import { UpcomingTaskList } from './upcoming-task-list';

export default async function UpcomingPage() {
  const tasks = await getUpcomingTasks(7);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={CalendarRange} title="Upcoming" description="Next 7 days" />
      {tasks.length > 0 ? (
        <UpcomingTaskList initialTasks={tasks} />
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="Nothing on the horizon"
          description="Tasks due in the next 7 days will show up here."
        />
      )}
    </div>
  );
}
