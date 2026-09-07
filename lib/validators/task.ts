import { z } from 'zod';

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const taskStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'completed']);

// Zod's bare .url() accepts any syntactically valid URL, including
// javascript:/data: schemes — the .refine() below is the actual security
// control, not a redundant belt-and-suspenders check.
const externalUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((url) => /^https?:\/\//i.test(url), {
    message: 'Link must start with http:// or https://',
  });

export const createTaskSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20_000).optional().nullable(),
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('todo'),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().int().min(0).max(24 * 60).optional().nullable(),
  aiEnergyScore: z.number().min(0).max(100).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
  isRecurring: z.boolean().optional(),
  externalUrl: externalUrlSchema.optional().nullable(),
});

export const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(20_000).optional().nullable(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().int().min(0).max(24 * 60).optional().nullable(),
  actualMinutes: z.number().int().min(0).optional(),
  aiEnergyScore: z.number().min(0).max(100).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  listId: z.string().uuid().optional(),
  isRecurring: z.boolean().optional(),
  externalUrl: externalUrlSchema.optional().nullable(),
});

export const toggleTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export const reorderTasksSchema = z.object({
  listId: z.string().uuid(),
  taskIds: z.array(z.string().uuid()).min(1).max(2_000),
});

export const setTaskTagsSchema = z.object({
  taskId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(50),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
