import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, 'Must be a hex color');

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: hexColor.default('#64748B'),
});

export const updateTagSchema = z.object({
  tagId: z.string().uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  color: hexColor.optional(),
});

export const deleteTagSchema = z.object({
  tagId: z.string().uuid(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
