import { createClient } from '@/lib/supabase/server';
import type { ListRow } from '@/types/database';

export async function getLists(): Promise<ListRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getListById(listId: string): Promise<ListRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOwnedLists(): Promise<ListRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
