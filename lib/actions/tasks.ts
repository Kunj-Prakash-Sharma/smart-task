'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ORDER_INDEX_GAP } from '@/lib/constants';
import { actionError, actionOk, mapSupabaseError, type ActionResult } from '@/lib/utils/errors';
import { mutable } from '@/lib/supabase/mutable';
import { nextRecurrenceDate } from '@/lib/utils/dates';
import {
  createTaskSchema,
  deleteTaskSchema,
  reorderTasksSchema,
  setTaskTagsSchema,
  toggleTaskSchema,
  updateTaskSchema,
} from '@/lib/validators/task';
import type { TaskRow } from '@/types/database';

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

/**
 * When a recurring task (recurrence_days non-empty) is completed, create
 * the next instance due on the next matching day. Best-effort: failures
 * here are logged but don't fail the completion itself, since the user's
 * completion action already succeeded by the time this runs.
 */
async function scheduleNextRecurrence(supabase: unknown, completed: TaskRow): Promise<void> {
  if (completed.recurrence_days.length === 0) return;

  const nextDate = nextRecurrenceDate(completed.due_date, completed.recurrence_days);
  if (!nextDate) return;

  const { data: lastTask } = await mutable(supabase)
    .from('tasks')
    .select('dynamic_order_index')
    .eq('list_id', completed.list_id)
    .order('dynamic_order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastOrder = lastTask?.dynamic_order_index ? Number(lastTask.dynamic_order_index) : 0;

  const { error } = await mutable(supabase).from('tasks').insert({
    id: crypto.randomUUID(),
    list_id: completed.list_id,
    title: completed.title,
    description: completed.description,
    priority: completed.priority,
    status: 'todo',
    due_date: nextDate.toISOString(),
    estimated_minutes: completed.estimated_minutes,
    assigned_to: completed.assigned_to,
    created_by: completed.created_by,
    recurrence_days: completed.recurrence_days,
    external_url: completed.external_url,
    dynamic_order_index: lastOrder + ORDER_INDEX_GAP,
  });

  if (error) {
    console.error('Failed to schedule next recurrence for task', completed.id, error.message);
  }
}

export async function createTask(input: unknown): Promise<ActionResult<TaskRow>> {
  const parsed = createTaskSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase, user } = await requireUser();

    const { data: lastTask, error: lastTaskError } = await mutable(supabase)
      .from('tasks')
      .select('dynamic_order_index')
      .eq('list_id', parsed.data.listId)
      .order('dynamic_order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastTaskError) {
      return actionError(mapSupabaseError(lastTaskError.message));
    }

    const lastOrder = lastTask?.dynamic_order_index ? Number(lastTask.dynamic_order_index) : 0;
    const nextOrder = lastOrder + ORDER_INDEX_GAP;

    // See createList() in lib/actions/lists.ts for why .insert() here cannot
    // chain .select(): tasks_select_accessible() queries public.tasks itself,
    // which trips the INSERT...RETURNING + RLS-recheck quirk.
    const id = crypto.randomUUID();

    const { error: insertError } = await mutable(supabase)
      .from('tasks')
      .insert({
        id,
        list_id: parsed.data.listId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        status: parsed.data.status,
        due_date: parsed.data.dueDate ?? null,
        estimated_minutes: parsed.data.estimatedMinutes ?? null,
        ai_energy_score: parsed.data.aiEnergyScore ?? null,
        assigned_to: parsed.data.assignedTo ?? null,
        created_by: user.id,
        dynamic_order_index: nextOrder,
        recurrence_days: parsed.data.recurrenceDays ?? [],
        external_url: parsed.data.externalUrl ?? null,
      });

    if (insertError) {
      return actionError(mapSupabaseError(insertError.message));
    }

    const { data, error } = await mutable(supabase).from('tasks').select('*').eq('id', id).maybeSingle();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }
    if (!data) {
      return actionError('Task was created but could not be loaded.');
    }

    if (parsed.data.tagIds?.length) {
      const { error: tagError } = await mutable(supabase)
        .from('task_tags')
        .insert(parsed.data.tagIds.map((tagId) => ({ task_id: data.id, tag_id: tagId })));

      if (tagError) {
        return actionError(mapSupabaseError(tagError.message));
      }
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function updateTask(input: unknown): Promise<ActionResult<TaskRow>> {
  const parsed = updateTaskSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();
    const { taskId, ...rest } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (rest.title !== undefined) patch.title = rest.title;
    if (rest.description !== undefined) patch.description = rest.description;
    if (rest.priority !== undefined) patch.priority = rest.priority;
    if (rest.status !== undefined) patch.status = rest.status;
    if (rest.dueDate !== undefined) patch.due_date = rest.dueDate;
    if (rest.estimatedMinutes !== undefined) patch.estimated_minutes = rest.estimatedMinutes;
    if (rest.actualMinutes !== undefined) patch.actual_minutes = rest.actualMinutes;
    if (rest.aiEnergyScore !== undefined) patch.ai_energy_score = rest.aiEnergyScore;
    if (rest.assignedTo !== undefined) patch.assigned_to = rest.assignedTo;
    if (rest.listId !== undefined) patch.list_id = rest.listId;
    if (rest.recurrenceDays !== undefined) patch.recurrence_days = rest.recurrenceDays;
    if (rest.externalUrl !== undefined) patch.external_url = rest.externalUrl;

    const { error: updateError } = await mutable(supabase).from('tasks').update(patch).eq('id', taskId);

    if (updateError) {
      return actionError(mapSupabaseError(updateError.message));
    }

    const { data, error } = await mutable(supabase).from('tasks').select('*').eq('id', taskId).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    if (patch.status === 'completed') {
      await scheduleNextRecurrence(supabase, data);
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function toggleTask(input: unknown): Promise<ActionResult<TaskRow>> {
  const parsed = toggleTaskSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();

    const { data: current, error: fetchError } = await mutable(supabase)
      .from('tasks')
      .select('status')
      .eq('id', parsed.data.taskId)
      .single();

    if (fetchError) {
      return actionError(mapSupabaseError(fetchError.message));
    }

    const nextStatus = current.status === 'completed' ? 'todo' : 'completed';

    const { error: updateError } = await mutable(supabase)
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', parsed.data.taskId);

    if (updateError) {
      return actionError(mapSupabaseError(updateError.message));
    }

    const { data, error } = await mutable(supabase)
      .from('tasks')
      .select('*')
      .eq('id', parsed.data.taskId)
      .single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    if (nextStatus === 'completed') {
      await scheduleNextRecurrence(supabase, data);
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function deleteTask(input: unknown): Promise<ActionResult<null>> {
  const parsed = deleteTaskSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.from('tasks').delete().eq('id', parsed.data.taskId);

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(null);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function reorderTasks(input: unknown): Promise<ActionResult<TaskRow[]>> {
  const parsed = reorderTasksSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();

    const { data, error } = await mutable(supabase).rpc('reorder_tasks', {
      p_list_id: parsed.data.listId,
      p_task_ids: parsed.data.taskIds,
    });

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data ?? []);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function setTaskTags(input: unknown): Promise<ActionResult<null>> {
  const parsed = setTaskTagsSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();
    const { taskId, tagIds } = parsed.data;

    const { error: deleteError } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      return actionError(mapSupabaseError(deleteError.message));
    }

    if (tagIds.length) {
      const { error: insertError } = await mutable(supabase)
        .from('task_tags')
        .insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));

      if (insertError) {
        return actionError(mapSupabaseError(insertError.message));
      }
    }

    revalidatePath('/', 'layout');

    return actionOk(null);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}
