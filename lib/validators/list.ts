import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, 'Must be a hex color');

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: hexColor.default('#6366F1'),
});

export const updateListSchema = z.object({
  listId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  color: hexColor.optional(),
});

export const deleteListSchema = z.object({
  listId: z.string().uuid(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
