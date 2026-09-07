'use client';

import { useMemo, useState } from 'react';
import type { TaskPriority, TaskStatus, TaskWithTags } from '@/types/database';

export function useTaskFilters(tasks: TaskWithTags[]) {
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (status !== 'all' && task.status !== status) return false;
      if (priority !== 'all' && task.priority !== priority) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, status, priority, search]);

  return { filtered, status, setStatus, priority, setPriority, search, setSearch };
}
