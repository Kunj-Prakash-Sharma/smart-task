'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteTask, reorderTasks, toggleTask, updateTask } from '@/lib/actions/tasks';
import { ORDER_INDEX_GAP } from '@/lib/constants';
import { openExternalLinkIfCompleting } from '@/lib/utils/external-link';
import type { TaskPriority, TaskStatus, TaskWithTags } from '@/types/database';

type TaskAction =
  | { type: 'toggle'; taskId: string }
  | { type: 'remove'; taskId: string }
  | { type: 'reorder'; orderedIds: string[] }
  | { type: 'priority'; taskId: string; priority: TaskPriority }
  | { type: 'status'; taskId: string; status: TaskStatus };

function applyOptimisticAction(state: TaskWithTags[], action: TaskAction): TaskWithTags[] {
  switch (action.type) {
    case 'toggle':
      return state.map((task) => {
        if (task.id !== action.taskId) return task;
        const isCompleted = task.status === 'completed';
        return {
          ...task,
          status: isCompleted ? 'todo' : 'completed',
          completed_at: isCompleted ? null : new Date().toISOString(),
        };
      });
    case 'remove':
      return state.filter((task) => task.id !== action.taskId);
    case 'reorder': {
      const orderIndexByTaskId = new Map(
        action.orderedIds.map((id, index) => [id, (index + 1) * ORDER_INDEX_GAP]),
      );
      return state.map((task) => {
        const dynamicOrderIndex = orderIndexByTaskId.get(task.id);
        return dynamicOrderIndex === undefined
          ? task
          : { ...task, dynamic_order_index: dynamicOrderIndex };
      });
    }
    case 'priority':
      return state.map((task) =>
        task.id === action.taskId ? { ...task, priority: action.priority } : task,
      );
    case 'status':
      return state.map((task) =>
        task.id === action.taskId ? { ...task, status: action.status } : task,
      );
    default:
      return state;
  }
}

export function useOptimisticTasks(initialTasks: TaskWithTags[]) {
  const [tasks, applyOptimistic] = useOptimistic(initialTasks, applyOptimisticAction);
  const [, startTransition] = useTransition();

  function toggle(taskId: string) {
    const current = tasks.find((task) => task.id === taskId);
    if (current) {
      const nextStatus = current.status === 'completed' ? 'todo' : 'completed';
      openExternalLinkIfCompleting(current.status, nextStatus, current.external_url);
    }

    startTransition(async () => {
      applyOptimistic({ type: 'toggle', taskId });
      const result = await toggleTask({ taskId });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function remove(taskId: string) {
    startTransition(async () => {
      applyOptimistic({ type: 'remove', taskId });
      const result = await deleteTask({ taskId });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function reorder(listId: string, orderedIds: string[]) {
    startTransition(async () => {
      applyOptimistic({ type: 'reorder', orderedIds });
      const result = await reorderTasks({ listId, taskIds: orderedIds });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function updatePriority(taskId: string, priority: TaskPriority) {
    startTransition(async () => {
      applyOptimistic({ type: 'priority', taskId, priority });
      const result = await updateTask({ taskId, priority });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function updateStatus(taskId: string, status: TaskStatus) {
    const current = tasks.find((task) => task.id === taskId);
    if (current) {
      openExternalLinkIfCompleting(current.status, status, current.external_url);
    }

    startTransition(async () => {
      applyOptimistic({ type: 'status', taskId, status });
      const result = await updateTask({ taskId, status });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return { tasks, toggle, remove, reorder, updatePriority, updateStatus };
}
