import { Badge, type BadgeProps } from '@/components/ui/badge';
import { PRIORITY_LABELS } from '@/lib/constants';
import type { TaskPriority } from '@/types/database';

export interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_VARIANTS: Record<TaskPriority, NonNullable<BadgeProps['variant']>> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'default',
  low: 'secondary',
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
