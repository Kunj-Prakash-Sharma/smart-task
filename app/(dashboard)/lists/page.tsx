import { Folders } from 'lucide-react';
import { ListCard } from '@/components/lists/list-card';
import { ListCreateDialog } from '@/components/lists/list-create-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { getLists } from '@/lib/data/lists';

export default async function ListsPage() {
  const lists = await getLists();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lists</h1>
        <ListCreateDialog />
      </div>

      {lists.length === 0 ? (
        <EmptyState
          icon={Folders}
          title="No lists yet"
          description="Create your first list to start organizing tasks."
          action={<ListCreateDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
