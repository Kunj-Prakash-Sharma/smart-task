import { createClient } from '@/lib/supabase/server';
import type { TaskWithTags } from '@/types/database';

const TASK_WITH_TAGS_SELECT = `
  id,
  list_id,
  title,
  description,
  priority,
  status,
  due_date,
  estimated_minutes,
  actual_minutes,
  dynamic_order_index,
  ai_energy_score,
  created_by,
  assigned_to,
  completed_at,
  created_at,
  updated_at,
  task_tags (
    tag_id,
    tags ( id, name, color, owner_id, created_at, updated_at )
  )
`;

export async function getTasksByList(listId: string): Promise<TaskWithTags[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .eq('list_id', listId)
    .order('dynamic_order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TaskWithTags[];
}

export async function getTaskById(taskId: string): Promise<TaskWithTags | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TaskWithTags | null;
}

export async function getTasksForCurrentUser(): Promise<TaskWithTags[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('dynamic_order_index', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TaskWithTags[];
}

export async function getTasksDueToday(): Promise<TaskWithTags[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
    .gte('due_date', startOfDay.toISOString())
    .lte('due_date', endOfDay.toISOString())
    .order('dynamic_order_index', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TaskWithTags[];
}

export async function getInboxTasks(): Promise<TaskWithTags[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .eq('assigned_to', user.id)
    .neq('created_by', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TaskWithTags[];
}

export async function getUpcomingTasks(days = 7): Promise<TaskWithTags[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + days);

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_WITH_TAGS_SELECT)
    .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
    .gte('due_date', now.toISOString())
    .lte('due_date', horizon.toISOString())
    .neq('status', 'completed')
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TaskWithTags[];
}
