import { notFound } from 'next/navigation';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { getListById } from '@/lib/data/lists';
import { getTasksByList } from '@/lib/data/tasks';

interface ListDetailPageProps {
  params: Promise<{ listId: string }>;
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { listId } = await params;

  const list = await getListById(listId);

  if (!list) {
    notFound();
  }

  const tasks = await getTasksByList(listId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: list.color }}
          />
          {list.name}
        </h1>
        <TaskCreateDialog listId={listId} />
      </div>

      <TaskBoard listId={listId} initialTasks={tasks} />
    </div>
  );
}
