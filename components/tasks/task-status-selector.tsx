'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LABELS, TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus } from '@/types/database';

export interface TaskStatusSelectorProps {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

export function TaskStatusSelector({ status, onChange, disabled }: TaskStatusSelectorProps) {
  return (
    <Select
      value={status}
      onValueChange={(value) => onChange(value as TaskStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-auto gap-1.5 px-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((value) => (
          <SelectItem key={value} value={value} className="text-xs">
            {STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
