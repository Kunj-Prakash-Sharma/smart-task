'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { actionError, actionOk, mapSupabaseError, type ActionResult } from '@/lib/utils/errors';
import { mutable } from '@/lib/supabase/mutable';
import { createTagSchema, deleteTagSchema, updateTagSchema } from '@/lib/validators/tag';
import type { TagRow } from '@/types/database';

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

export async function listTags(): Promise<TagRow[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('owner_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createTag(input: unknown): Promise<ActionResult<TagRow>> {
  const parsed = createTagSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase, user } = await requireUser();

    // See createList() in lib/actions/lists.ts for why .insert() here cannot
    // chain .select(): tags_select_accessible() queries public.tags itself,
    // which trips the same INSERT...RETURNING + RLS-recheck quirk.
    const id = crypto.randomUUID();

    const { error: insertError } = await mutable(supabase)
      .from('tags')
      .insert({ id, name: parsed.data.name, color: parsed.data.color, owner_id: user.id });

    if (insertError) {
      return actionError(mapSupabaseError(insertError.message));
    }

    const { data, error } = await mutable(supabase).from('tags').select('*').eq('id', id).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function updateTag(input: unknown): Promise<ActionResult<TagRow>> {
  const parsed = updateTagSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();
    const { tagId, ...rest } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.color !== undefined) patch.color = rest.color;

    const { error: updateError } = await mutable(supabase).from('tags').update(patch).eq('id', tagId);

    if (updateError) {
      return actionError(mapSupabaseError(updateError.message));
    }

    const { data, error } = await mutable(supabase).from('tags').select('*').eq('id', tagId).single();

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(data);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

export async function deleteTag(input: unknown): Promise<ActionResult<null>> {
  const parsed = deleteTagSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.from('tags').delete().eq('id', parsed.data.tagId);

    if (error) {
      return actionError(mapSupabaseError(error.message));
    }

    revalidatePath('/', 'layout');

    return actionOk(null);
  } catch (err) {
    return actionError(err instanceof Error ? err.message : 'Something went wrong');
  }
}
