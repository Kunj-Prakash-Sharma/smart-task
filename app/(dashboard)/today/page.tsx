import { CalendarCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { getTasksDueToday } from '@/lib/data/tasks';
import { TodayTaskList } from './today-task-list';

export default async function TodayPage() {
  const tasks = await getTasksDueToday();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={CalendarCheck} title="Today" />
      {tasks.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <TodayTaskList initialTasks={tasks} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={CalendarCheck} title="Nothing due today. Enjoy the calm." />
      )}
    </div>
  );
}
