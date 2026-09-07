import { createClient } from '@/lib/supabase/server';
import type { UserRow } from '@/types/database';

export async function getProfile(userId: string): Promise<UserRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
    .returns<UserRow>();

  if (error) {
    return null;
  }

  return data;
}
