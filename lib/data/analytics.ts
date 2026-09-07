import { createClient } from '@/lib/supabase/server';
import type {
  AnalyticsCompletionVelocity7dRow,
  AnalyticsDailyProductivityRow,
  AnalyticsFocusTimeRow,
  AnalyticsPriorityDistributionRow,
} from '@/types/database';

export async function getFocusTime(): Promise<AnalyticsFocusTimeRow | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('analytics_task_focus_time')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPriorityDistribution(): Promise<AnalyticsPriorityDistributionRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('analytics_task_priority_distribution')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getCompletionVelocity7d(): Promise<AnalyticsCompletionVelocity7dRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('analytics_task_completion_velocity_7d')
    .select('*')
    .eq('user_id', user.id)
    .order('completion_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDailyProductivity(): Promise<AnalyticsDailyProductivityRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('analytics_daily_productivity')
    .select('*')
    .eq('user_id', user.id)
    .order('day', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
