import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ListRow } from '@/types/database';

export interface ListCardProps {
  list: ListRow;
  taskCount?: number;
}

export function ListCard({ list, taskCount }: ListCardProps) {
  return (
    <Link href={`/lists/${list.id}`} className="group block">
      <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: list.color }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{list.name}</span>
            {taskCount !== undefined && (
              <span className="text-sm text-muted-foreground">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>
          <ChevronRight
            size={16}
            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
