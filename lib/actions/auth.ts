'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { actionError, actionOk, type ActionResult } from '@/lib/utils/errors';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

const signUpSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(1).max(120).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export async function signIn(input: unknown): Promise<ActionResult<null>> {
  const parsed = credentialsSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return actionError(error.message);
  }

  redirect('/');
}

export async function signUp(input: unknown): Promise<ActionResult<null>> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return actionError(error.message);
  }

  return actionOk(null);
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error) {
    return actionError(error.message);
  }

  return actionOk(null);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
