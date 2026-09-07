'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { actionError, actionOk, mapSupabaseError, type ActionResult } from '@/lib/utils/errors';
import { mutable } from '@/lib/supabase/mutable';
import type { UserRow } from '@/types/database';

const updateProfileSchema = z.object({
  displayName: z.string().trim().max(120).optional().nullable(),
  avatarUrl: z.string().trim().max(2000).optional().nullable(),
});

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

export async function updateProfile(input: unknown): Promise<ActionResult<UserRow>> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase, user } = await requireUser();

    // See createList() in lib/actions/lists.ts: mutations here deliberately
    // avoid chaining .select() onto .insert()/.update() and fetch the row
    // back as a separate statement instead.
    const { error: updateError } = await mutable(supabase)
      .from('users')
      .update({
        display_name: parsed.data.displayName || null,
        avatar_url: parsed.data.avatarUrl || null,
      })
      .eq('id', user.id);

    if (updateError) {
      return actionError(mapSupabaseError(updateError.message));
    }

    const { data, error } = await mutable(supabase).from('users').select('*').eq('id', user.id).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}
