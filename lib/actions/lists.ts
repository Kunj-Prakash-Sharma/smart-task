'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { actionError, actionOk, mapSupabaseError, type ActionResult } from '@/lib/utils/errors';
import { mutable } from '@/lib/supabase/mutable';
import { createListSchema, deleteListSchema, updateListSchema } from '@/lib/validators/list';
import type { ListRow } from '@/types/database';

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

export async function createList(input: unknown): Promise<ActionResult<ListRow>> {
  const parsed = createListSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase, user } = await requireUser();

    // Insert without a chained .select(): PostgREST's INSERT ... RETURNING
    // also re-checks the row against the table's SELECT policy, and
    // lists_select_accessible() queries public.lists itself, which trips a
    // Postgres RLS quirk within that single statement ("new row violates
    // row-level security policy") even though the insert itself is allowed.
    // Fetching the row back as a separate statement avoids it entirely.
    const id = crypto.randomUUID();

    const { error: insertError } = await mutable(supabase)
      .from('lists')
      .insert({ id, name: parsed.data.name, color: parsed.data.color, owner_id: user.id });

    if (insertError) {
      return actionError(mapSupabaseError(insertError.message));
    }

    const { data, error } = await mutable(supabase).from('lists').select('*').eq('id', id).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function updateList(input: unknown): Promise<ActionResult<ListRow>> {
  const parsed = updateListSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();
    const { listId, ...rest } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.color !== undefined) patch.color = rest.color;

    const { error: updateError } = await mutable(supabase).from('lists').update(patch).eq('id', listId);

    if (updateError) {
      return actionError(mapSupabaseError(updateError.message));
    }

    const { data, error } = await mutable(supabase).from('lists').select('*').eq('id', listId).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function deleteList(input: unknown): Promise<ActionResult<null>> {
  const parsed = deleteListSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.from('lists').delete().eq('id', parsed.data.listId);

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(null);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}
