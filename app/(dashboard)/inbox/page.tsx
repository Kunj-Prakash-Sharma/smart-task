import { Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { getInboxTasks } from '@/lib/data/tasks';
import { InboxTaskList } from './inbox-task-list';

export default async function InboxPage() {
  const tasks = await getInboxTasks();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">Tasks assigned to you by others</p>
      </div>
      {tasks.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <InboxTaskList initialTasks={tasks} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={Inbox} title="Nothing delegated to you yet." />
      )}
    </div>
  );
}
