'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ListRow } from '@/types/database';

export interface ListSelectorProps {
  lists: ListRow[];
  value: string | null;
  onChange: (listId: string) => void;
}

export function ListSelector({ lists, value, onChange }: ListSelectorProps) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a list" />
      </SelectTrigger>
      <SelectContent>
        {lists.map((list) => (
          <SelectItem key={list.id} value={list.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: list.color }}
              />
              {list.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
