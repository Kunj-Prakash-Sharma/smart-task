import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { ListRow } from '@/types/database';

export interface ListCardProps {
  list: ListRow;
  taskCount?: number;
}

export function ListCard({ list, taskCount }: ListCardProps) {
  return (
    <Link href={`/lists/${list.id}`}>
      <Card className="transition-all hover:border-foreground/20 hover:shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: list.color }}
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{list.name}</span>
            {taskCount !== undefined && (
              <span className="text-sm text-muted-foreground">{taskCount} tasks</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
