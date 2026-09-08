'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CheckCircle2, Plus } from 'lucide-react';
import { toggleTask, updateTask } from '@/lib/actions/tasks';
import { openExternalLinkIfCompleting } from '@/lib/utils/external-link';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import type { TaskRow, TaskWithTags } from '@/types/database';

function byDueDateAscending(a: TaskWithTags, b: TaskWithTags): number {
  const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity;
  const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity;
  return aTime - bTime;
}

const PIP_WIDTH = 300;
const PIP_HEIGHT = 132;
const TICK_MS = 1000;

interface LiveTaskContextValue {
  liveTask: TaskWithTags | null;
  isRunning: boolean;
  elapsedSeconds: number;
  usingFloatingWindow: boolean;
  startFocus: (task: TaskWithTags) => void;
  play: () => void;
  pause: () => void;
  markDone: () => void;
  stopFocus: () => void;
  goToNext: () => void;
}

const LiveTaskContext = createContext<LiveTaskContextValue | null>(null);

export function useLiveTask() {
  const ctx = useContext(LiveTaskContext);
  if (!ctx) {
    throw new Error('useLiveTask must be used within a LiveTaskProvider');
  }
  return ctx;
}

// Plain hex colors with a prefers-color-scheme override, rather than the
// light-dark() CSS function: light-dark() is newer than Document
// Picture-in-Picture itself, so on a Chrome version that supports the PiP
// API but not light-dark(), the color/background declarations are dropped
// entirely and text can end up invisible against the background.
const PIP_STYLES = `
  html, body { height: 100%; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    background: #ffffff;
    color: #0a0e1a;
  }
  .wrap { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; height: 100%; box-sizing: border-box; }
  .title { font-size: 13px; font-weight: 600; line-height: 1.3; color: inherit; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .timer { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; color: inherit; }
  .row { display: flex; gap: 8px; margin-top: auto; }
  .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; height: 100%; text-align: center; }
  .empty p { margin: 0; font-size: 13px; font-weight: 600; }
  button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; border-radius: 8px; border: 1px solid #e2e2e7; background: #f5f5f7; color: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
  button:hover { background: #ebebef; }
  button.primary { background: #6366f1; border-color: #6366f1; color: #ffffff; }
  button.primary:hover { background: #4f46e5; }
  button.done { background: #16a34a; border-color: #16a34a; color: #ffffff; }
  button.done:hover { background: #15803d; }

  @media (prefers-color-scheme: dark) {
    body { background: #0a0e1a; color: #f4f5f7; }
    button { border-color: #2a2f3a; background: #171b26; }
    button:hover { background: #1f2430; }
  }
`;

export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export interface LiveTaskProviderProps {
  children: ReactNode;
  /** Today's due tasks, used as the queue the widget's "Next" button pulls from. */
  todayTasks: TaskWithTags[];
  /** List the widget's own "+" quick-add creates into; null hides that trigger. */
  defaultListId: string | null;
}

export function LiveTaskProvider({ children, todayTasks, defaultListId }: LiveTaskProviderProps) {
  const [liveTask, setLiveTask] = useState<TaskWithTags | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [usingFloatingWindow, setUsingFloatingWindow] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);

  const liveTaskRef = useRef(liveTask);
  liveTaskRef.current = liveTask;

  // Seeded once from the server-fetched snapshot; not kept live-synced with
  // the server afterward — "Next" just walks this in-memory queue for the
  // rest of the session, same tradeoff as the sidebar's list snapshot.
  // Only "todo" tasks are candidates (not ones already in progress or done),
  // ordered so the earliest — and any already-overdue — deadline comes first.
  const queueRef = useRef<TaskWithTags[]>(
    todayTasks.filter((task) => task.status === 'todo').sort(byDueDateAscending),
  );

  // Read via refs (not closed-over state) inside stable useCallbacks below,
  // so play()/flushElapsed() always see the latest value instead of whatever
  // was captured the one time the memoized callback was created.
  const elapsedSecondsRef = useRef(0);
  elapsedSecondsRef.current = elapsedSeconds;

  const startedAtRef = useRef<number | null>(null);
  const creditedSecondsRef = useRef(0);
  const pipWindowRef = useRef<Window | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Fire-and-forget status sync — doesn't block the timer UI on the network
  // round trip, just reports failures.
  const setTaskStatusRemote = useCallback((taskId: string, status: 'todo' | 'in_progress') => {
    void updateTask({ taskId, status }).then((result) => {
      if (!result.ok) toast.error(result.error);
    });
  }, []);

  const flushElapsed = useCallback(async (options?: { revertToTodo?: boolean }) => {
    const task = liveTaskRef.current;
    if (!task) return;

    const currentElapsed = elapsedSecondsRef.current;
    const pendingSeconds = currentElapsed - creditedSecondsRef.current;
    const minutesToAdd = Math.round(pendingSeconds / 60);

    const patch: { taskId: string; actualMinutes?: number; status?: 'todo' } = { taskId: task.id };
    let nextActualMinutes = task.actual_minutes;

    if (minutesToAdd > 0) {
      creditedSecondsRef.current = currentElapsed;
      nextActualMinutes = task.actual_minutes + minutesToAdd;
      patch.actualMinutes = nextActualMinutes;
    }

    // Only revert a task WE moved to in_progress — never touch a task that
    // was already completed (or otherwise) by the time we get here.
    const shouldRevert = Boolean(options?.revertToTodo) && task.status === 'in_progress';
    if (shouldRevert) {
      patch.status = 'todo';
    }

    if (patch.actualMinutes === undefined && patch.status === undefined) return;

    setLiveTask({
      ...task,
      actual_minutes: nextActualMinutes,
      status: shouldRevert ? 'todo' : task.status,
    });

    const result = await updateTask(patch);
    if (!result.ok) {
      toast.error(result.error);
    }
  }, []);

  const pause = useCallback(() => {
    clearTick();
    setIsRunning(false);
    void flushElapsed({ revertToTodo: true });
  }, [clearTick, flushElapsed]);

  const play = useCallback(() => {
    const task = liveTaskRef.current;
    if (!task || intervalRef.current !== null) return;

    startedAtRef.current = Date.now() - elapsedSecondsRef.current * 1000;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (startedAtRef.current === null) return;
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, TICK_MS);

    if (task.status !== 'in_progress') {
      setLiveTask({ ...task, status: 'in_progress' });
      setTaskStatusRemote(task.id, 'in_progress');
    }
  }, [setTaskStatusRemote]);

  const closeFloatingWindow = useCallback(() => {
    pipWindowRef.current?.close();
    pipWindowRef.current = null;
    setPortalContainer(null);
    setUsingFloatingWindow(false);
  }, []);

  const resetLiveTaskState = useCallback(() => {
    setLiveTask(null);
    setIsRunning(false);
    setElapsedSeconds(0);
    creditedSecondsRef.current = 0;
    startedAtRef.current = null;
  }, []);

  // Shared by startFocus() and goToNext(): starts the timer for `task` and
  // (re)renders the widget with it, without touching the floating window
  // itself — goToNext reuses whatever window is already open.
  const beginTask = useCallback(
    (task: TaskWithTags) => {
      const startingTask = task.status === 'in_progress' ? task : { ...task, status: 'in_progress' as const };

      setShowAllDone(false);
      setLiveTask(startingTask);
      setElapsedSeconds(0);
      creditedSecondsRef.current = 0;
      startedAtRef.current = Date.now();
      setIsRunning(true);

      clearTick();
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current === null) return;
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, TICK_MS);

      if (task.status !== 'in_progress') {
        setTaskStatusRemote(task.id, 'in_progress');
      }
    },
    [clearTick, setTaskStatusRemote],
  );

  // Fed to the widget's own "+" quick-add (TaskCreateDialog). A new task
  // always joins the in-memory queue; if nothing is currently playing it
  // becomes the live task right away via the same beginTask() path
  // goToNext()/startFocus() already use, otherwise it just waits its turn.
  const handleQuickTaskCreated = useCallback(
    (task: TaskRow) => {
      const withTags: TaskWithTags = { ...task, task_tags: [] };
      queueRef.current = [...queueRef.current, withTags].sort(byDueDateAscending);

      if (!liveTaskRef.current) {
        setShowAllDone(false);
        beginTask(withTags);
      }
    },
    [beginTask],
  );

  const stopFocus = useCallback(() => {
    clearTick();
    void flushElapsed({ revertToTodo: true });
    const currentId = liveTaskRef.current?.id;
    queueRef.current = queueRef.current.filter((task) => task.id !== currentId);
    closeFloatingWindow();
    resetLiveTaskState();
    setShowAllDone(false);
  }, [clearTick, closeFloatingWindow, flushElapsed, resetLiveTaskState]);

  const markDone = useCallback(() => {
    const task = liveTaskRef.current;
    if (task) {
      openExternalLinkIfCompleting(task.status, 'completed', task.external_url);
    }

    clearTick();
    void flushElapsed();
    queueRef.current = queueRef.current.filter((queued) => queued.id !== task?.id);
    if (task && task.status !== 'completed') {
      void toggleTask({ taskId: task.id }).then((result) => {
        if (!result.ok) toast.error(result.error);
      });
    }
    closeFloatingWindow();
    resetLiveTaskState();
    setShowAllDone(false);
  }, [clearTick, closeFloatingWindow, flushElapsed, resetLiveTaskState]);

  const goToNext = useCallback(() => {
    clearTick();
    void flushElapsed({ revertToTodo: true });

    const currentId = liveTaskRef.current?.id;
    queueRef.current = queueRef.current.filter((task) => task.id !== currentId);
    const next = queueRef.current[0] ?? null;

    if (!next) {
      resetLiveTaskState();
      setShowAllDone(true);
      return;
    }

    queueRef.current = queueRef.current.slice(1);
    beginTask(next);
  }, [clearTick, flushElapsed, resetLiveTaskState, beginTask]);

  const openFloatingWindow = useCallback(async () => {
    if (typeof window === 'undefined' || !window.documentPictureInPicture) {
      setPortalContainer(null);
      setUsingFloatingWindow(false);
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
      });

      pipWindowRef.current = pipWindow;

      const style = pipWindow.document.createElement('style');
      style.textContent = PIP_STYLES;
      pipWindow.document.head.appendChild(style);

      const root = pipWindow.document.createElement('div');
      root.id = 'live-task-root';
      root.style.height = '100%';
      pipWindow.document.body.appendChild(root);

      pipWindow.addEventListener('pagehide', () => {
        pipWindowRef.current = null;
        setPortalContainer(null);
        setUsingFloatingWindow(false);
        pause();
      });

      setPortalContainer(root);
      setUsingFloatingWindow(true);
    } catch {
      setPortalContainer(null);
      setUsingFloatingWindow(false);
      toast.error('Could not open the floating window — showing an in-page timer instead.');
    }
  }, [pause]);

  const startFocus = useCallback(
    (task: TaskWithTags) => {
      if (liveTaskRef.current && liveTaskRef.current.id !== task.id) {
        clearTick();
        void flushElapsed();
      }

      beginTask(task);
      void openFloatingWindow();
    },
    [clearTick, flushElapsed, beginTask, openFloatingWindow],
  );

  useEffect(() => clearTick, [clearTick]);

  const value = useMemo<LiveTaskContextValue>(
    () => ({
      liveTask,
      isRunning,
      elapsedSeconds,
      usingFloatingWindow,
      startFocus,
      play,
      pause,
      markDone,
      stopFocus,
      goToNext,
    }),
    [
      liveTask,
      isRunning,
      elapsedSeconds,
      usingFloatingWindow,
      startFocus,
      play,
      pause,
      markDone,
      stopFocus,
      goToNext,
    ],
  );

  const showWidget = liveTask !== null || showAllDone;

  const widget = showWidget ? (
    <LiveTaskWidgetContent
      task={liveTask}
      elapsedSeconds={elapsedSeconds}
      isRunning={isRunning}
      onPlay={play}
      onPause={pause}
      onDone={markDone}
      onStop={stopFocus}
      onNext={goToNext}
      floating={usingFloatingWindow}
      defaultListId={defaultListId}
      onTaskCreated={handleQuickTaskCreated}
    />
  ) : null;

  return (
    <LiveTaskContext.Provider value={value}>
      {children}
      {showWidget && usingFloatingWindow && portalContainer ? createPortal(widget, portalContainer) : null}
      {showWidget && !usingFloatingWindow ? (
        <div className="fixed bottom-4 right-4 z-50 w-72 overflow-hidden rounded-xl border bg-card shadow-lg">
          {widget}
        </div>
      ) : null}
    </LiveTaskContext.Provider>
  );
}

interface LiveTaskWidgetContentProps {
  /** null means the queue is empty — render the "all done" state instead. */
  task: TaskWithTags | null;
  elapsedSeconds: number;
  isRunning: boolean;
  floating: boolean;
  defaultListId: string | null;
  onPlay: () => void;
  onPause: () => void;
  onDone: () => void;
  onStop: () => void;
  onNext: () => void;
  onTaskCreated: (task: TaskRow) => void;
}

function LiveTaskWidgetContent({
  task,
  elapsedSeconds,
  isRunning,
  floating,
  defaultListId,
  onPlay,
  onPause,
  onDone,
  onStop,
  onNext,
  onTaskCreated,
}: LiveTaskWidgetContentProps) {
  // The trigger is often clicked while the PiP window — not the main tab —
  // has OS focus. TaskCreateDialog's Dialog portals into the main
  // document (see the module comment on PIP_STYLES for why), so without
  // this the dialog can pop up behind/unnoticed on an unfocused tab.
  // Best-effort: browsers are free to ignore a script-initiated focus().
  function focusOpenerWindow() {
    try {
      window.focus();
    } catch {
      // ignore
    }
  }

  // Two trigger sizes for the same dialog: a compact "Add" button that sits
  // next to the timer controls while a task is active, and a full-width
  // "Add task" button alongside "Close" once the queue is empty. Both are
  // no-ops when there's no owned list to create into.
  const addTaskIconTrigger =
    defaultListId !== null ? (
      <TaskCreateDialog
        listId={defaultListId}
        onCreated={onTaskCreated}
        trigger={
          floating ? (
            <button
              type="button"
              aria-label="Add task"
              title="Add task"
              onClick={focusOpenerWindow}
              style={{ flex: '0 0 auto', height: 24, padding: '0 8px', gap: 4 }}
            >
              <Plus size={12} />
              Add
            </button>
          ) : (
            <button
              type="button"
              aria-label="Add task"
              title="Add task"
              onClick={focusOpenerWindow}
              className="flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus size={13} />
              Add
            </button>
          )
        }
      />
    ) : null;

  const addTaskFullTrigger =
    defaultListId !== null ? (
      <TaskCreateDialog
        listId={defaultListId}
        onCreated={onTaskCreated}
        trigger={
          floating ? (
            <button type="button" className="primary" onClick={focusOpenerWindow}>
              <Plus size={13} />
              Add task
            </button>
          ) : (
            <button
              type="button"
              onClick={focusOpenerWindow}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={14} />
              Add task
            </button>
          )
        }
      />
    ) : null;

  if (!task) {
    if (floating) {
      return (
        <div className="wrap">
          <div className="empty">
            <CheckCircle2 size={28} color="#16a34a" />
            <p>You&apos;re all good today!</p>
          </div>
          <div className="row">
            <button type="button" onClick={onStop}>
              Close
            </button>
            {addTaskFullTrigger}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        <CheckCircle2 size={28} className="text-success" />
        <p className="text-sm font-semibold">You&apos;re all good today!</p>
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onStop}
            className="h-8 flex-1 rounded-md border text-xs font-semibold hover:bg-accent"
          >
            Close
          </button>
          {addTaskFullTrigger}
        </div>
      </div>
    );
  }

  if (floating) {
    return (
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div className="title" style={{ flex: 1 }}>
            {task.title}
          </div>
          {addTaskIconTrigger}
        </div>
        <div className="timer">{formatElapsed(elapsedSeconds)}</div>
        <div className="row">
          {isRunning ? (
            <button type="button" onClick={onPause}>
              Pause
            </button>
          ) : (
            <button type="button" className="primary" onClick={onPlay}>
              Play
            </button>
          )}
          <button type="button" onClick={onNext}>
            Next
          </button>
          <button type="button" className="done" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 flex-1 text-sm font-semibold">{task.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          {addTaskIconTrigger}
          <button
            type="button"
            onClick={onStop}
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label="Stop focus"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums">{formatElapsed(elapsedSeconds)}</div>
      <div className="flex gap-2">
        {isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="h-8 flex-1 rounded-md border text-xs font-semibold hover:bg-accent"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="h-8 flex-1 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Play
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="h-8 flex-1 rounded-md border text-xs font-semibold hover:bg-accent"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-8 flex-1 rounded-md bg-success text-xs font-semibold text-success-foreground hover:bg-success/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
