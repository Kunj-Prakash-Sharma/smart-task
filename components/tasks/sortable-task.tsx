'use client';

import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

export interface SortableTaskProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

export function SortableTask({ id, children, disabled }: SortableTaskProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'z-10 opacity-90 shadow-lg [&>*]:rotate-1')}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
