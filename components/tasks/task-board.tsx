'use client';

import { useEffect, useState } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { TaskColumn } from '@/components/tasks/task-column';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { useOptimisticTasks } from '@/hooks/use-optimistic-tasks';
import { TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus, TaskWithTags } from '@/types/database';

export interface TaskBoardProps {
  listId: string;
  initialTasks: TaskWithTags[];
}

export function TaskBoard({ listId, initialTasks }: TaskBoardProps) {
  const { tasks, toggle, reorder, updateStatus } = useOptimisticTasks(initialTasks);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);
  // Without an activation constraint, PointerSensor treats every pointerdown
  // as a potential drag start, which swallows plain clicks on a card (the
  // card's onClick — opening the detail drawer — never fires). Requiring a
  // few pixels of movement before a gesture counts as a drag lets a plain
  // click pass through normally while still allowing real drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // dnd-kit assigns an internal aria-describedby id via a counter that can
  // increment differently between the SSR pass and the client hydration pass
  // (especially under React's reactStrictMode double-render in dev), causing
  // a hydration mismatch warning. Mounting DndContext only after hydration
  // sidesteps it — the pre-mount board renders the same columns, just
  // without drag being wired up yet, which is imperceptible in practice.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const columns = TASK_STATUSES.map((status) => ({
    status,
    tasks: tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.dynamic_order_index - b.dynamic_order_index),
  }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    const overTask = tasks.find((task) => task.id === overId);
    const targetStatus: TaskStatus | null = overTask
      ? overTask.status
      : (TASK_STATUSES as string[]).includes(overId)
        ? (overId as TaskStatus)
        : null;

    if (!targetStatus) return;

    if (activeTask.status !== targetStatus) {
      updateStatus(activeId, targetStatus);
    }

    const columnIds = tasks
      .filter((task) => task.status === targetStatus && task.id !== activeId)
      .sort((a, b) => a.dynamic_order_index - b.dynamic_order_index)
      .map((task) => task.id);

    const insertAt = overTask && overTask.id !== activeId ? columnIds.indexOf(overTask.id) : -1;
    columnIds.splice(insertAt === -1 ? columnIds.length : insertAt, 0, activeId);

    reorder(listId, columnIds);
  }

  const columnsMarkup = (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map(({ status, tasks: columnTasks }) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={columnTasks}
          onToggle={toggle}
          onSelect={setSelectedTask}
        />
      ))}
    </div>
  );

  return (
    <>
      {mounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {columnsMarkup}
        </DndContext>
      ) : (
        columnsMarkup
      )}
      <TaskDetailDrawer
        task={selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        onToggle={toggle}
      />
    </>
  );
}
