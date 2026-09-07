import { CalendarCheck, LayoutDashboard, ListTodo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ListCard } from '@/components/lists/list-card';
import { ListCreateDialog } from '@/components/lists/list-create-dialog';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { getOwnedLists } from '@/lib/data/lists';
import { getTasksDueToday } from '@/lib/data/tasks';
import { DueTodayList } from './due-today-list';

export default async function OverviewPage() {
  const [dueTodayTasks, ownedLists] = await Promise.all([getTasksDueToday(), getOwnedLists()]);
  const firstOwnedList = ownedLists[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Overview"
        action={firstOwnedList ? <TaskCreateDialog listId={firstOwnedList.id} /> : null}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Due today</h2>
        {dueTodayTasks.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <DueTodayList initialTasks={dueTodayTasks} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState icon={CalendarCheck} title="Nothing due today" />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Your lists</h2>
        {ownedLists.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ListTodo}
            title="No lists yet"
            description="Create your first list to start organizing tasks."
            action={<ListCreateDialog />}
          />
        )}
      </section>
    </div>
  );
}
