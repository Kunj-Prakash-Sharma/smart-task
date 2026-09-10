'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Pause, Play, Repeat, Timer } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RecurrenceDayPicker } from '@/components/tasks/recurrence-day-picker';
import { TaskStatusSelector } from '@/components/tasks/task-status-selector';
import { TaskTags } from '@/components/tasks/task-tags';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { deleteTask, updateTask } from '@/lib/actions/tasks';
import { PRIORITY_LABELS, TASK_PRIORITIES } from '@/lib/constants';
import { describeRecurrence, toDateInputValue } from '@/lib/utils/dates';
import { openExternalLinkIfCompleting } from '@/lib/utils/external-link';
import { formatElapsed, useLiveTask } from '@/hooks/use-live-task';
import type { TaskPriority, TaskStatus, TaskWithTags } from '@/types/database';

export interface TaskDetailDrawerProps {
  task: TaskWithTags | null;
  onOpenChange: (open: boolean) => void;
  onToggle: (taskId: string) => void;
}

export function TaskDetailDrawer({ task, onOpenChange, onToggle }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateValue, setDueDateValue] = useState('');
  const [externalUrlValue, setExternalUrlValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { liveTask, isRunning, elapsedSeconds, startFocus, play, pause } = useLiveTask();

  // Re-sync local fields only when the selected task changes, not on every
  // field edit, so in-progress typing isn't clobbered by unrelated re-renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setDueDateValue(toDateInputValue(task?.due_date ?? null));
    setExternalUrlValue(task?.external_url ?? '');
  }, [task?.id]);

  if (!task) {
    return <Sheet open={false} onOpenChange={onOpenChange} />;
  }

  const currentTask = task;
  const tags = currentTask.task_tags.map((taskTag) => taskTag.tags);

  async function handleTitleBlur() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(currentTask.title);
      return;
    }
    if (nextTitle === currentTask.title) return;

    const result = await updateTask({ taskId: currentTask.id, title: nextTitle });
    if (!result.ok) {
      toast.error(result.error);
      setTitle(currentTask.title);
      return;
    }
    toast.success('Task updated');
  }

  async function handleDescriptionBlur() {
    if (description === (currentTask.description ?? '')) return;

    const result = await updateTask({ taskId: currentTask.id, description });
    if (!result.ok) {
      toast.error(result.error);
      setDescription(currentTask.description ?? '');
      return;
    }
    toast.success('Task updated');
  }

  async function handleStatusChange(status: TaskStatus) {
    openExternalLinkIfCompleting(currentTask.status, status, currentTask.external_url);

    const result = await updateTask({ taskId: currentTask.id, status });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Task updated');
  }

  async function handlePriorityChange(priority: TaskPriority) {
    const result = await updateTask({ taskId: currentTask.id, priority });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Task updated');
  }

  async function handleDueDateBlur() {
    const currentValue = toDateInputValue(currentTask.due_date);
    if (dueDateValue === currentValue) return;

    const dueDate = dueDateValue ? new Date(dueDateValue).toISOString() : null;
    const result = await updateTask({ taskId: currentTask.id, dueDate });
    if (!result.ok) {
      toast.error(result.error);
      setDueDateValue(currentValue);
      return;
    }
    toast.success('Task updated');
  }

  async function handleExternalUrlBlur() {
    const trimmed = externalUrlValue.trim();
    const currentValue = currentTask.external_url ?? '';
    if (trimmed === currentValue) return;

    const result = await updateTask({ taskId: currentTask.id, externalUrl: trimmed || null });
    if (!result.ok) {
      toast.error(result.error);
      setExternalUrlValue(currentValue);
      return;
    }
    toast.success('Task updated');
  }

  async function handleRecurrenceChange(days: number[]) {
    const result = await updateTask({ taskId: currentTask.id, recurrenceDays: days });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(describeRecurrence(days));
  }

  async function handleDelete() {
    const result = await deleteTask({ taskId: currentTask.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Task deleted');
    onOpenChange(false);
  }

  return (
    <>
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent
          key={currentTask.id}
          side="right"
          className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader>
            <div className="flex items-start gap-2 pr-6">
              <Checkbox
                className="mt-1"
                checked={currentTask.status === 'completed'}
                onCheckedChange={() => onToggle(currentTask.id)}
              />
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={handleTitleBlur}
                className="h-auto flex-1 border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0"
              />
            </div>
            <SheetTitle className="sr-only">Task details</SheetTitle>
            <SheetDescription className="sr-only">
              View and edit this task&apos;s details.
            </SheetDescription>
          </SheetHeader>

          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description…"
            className="min-h-24 resize-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusSelector status={currentTask.status} onChange={handleStatusChange} />
            <Select
              value={currentTask.priority}
              onValueChange={(value) => handlePriorityChange(value as TaskPriority)}
            >
              <SelectTrigger className="h-8 w-auto gap-1.5 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {PRIORITY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="datetime-local"
              value={dueDateValue}
              onChange={(event) => setDueDateValue(event.target.value)}
              onBlur={handleDueDateBlur}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title={describeRecurrence(currentTask.recurrence_days)}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
                    currentTask.recurrence_days.length > 0
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Repeat size={13} />
                  {currentTask.recurrence_days.length > 0
                    ? describeRecurrence(currentTask.recurrence_days)
                    : 'Repeat'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="start">
                <RecurrenceDayPicker
                  value={currentTask.recurrence_days}
                  onChange={handleRecurrenceChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="url"
              value={externalUrlValue}
              onChange={(event) => setExternalUrlValue(event.target.value)}
              onBlur={handleExternalUrlBlur}
              placeholder="Link a Jira/Trello card…"
              className="h-8 flex-1 text-xs"
            />
            {currentTask.external_url ? (
              <a
                href={currentTask.external_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open linked task"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <TaskTags tags={tags} />
            </div>
          ) : null}

          <SheetFooter className="mt-auto border-t pt-4 sm:justify-between">
            {liveTask?.id === currentTask.id ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {formatElapsed(elapsedSeconds)}
                </span>
                {isRunning ? (
                  <Button type="button" variant="outline" size="sm" onClick={pause}>
                    <Pause size={14} />
                    Pause
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={play}>
                    <Play size={14} />
                    Play
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startFocus(currentTask)}
              >
                <Timer size={14} />
                Start focus
              </Button>
            )}
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Delete task
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete task"
        description="This will permanently delete this task. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
