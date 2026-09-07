-- ============================================================
-- RECURRING TASKS ("repeat every working day")
-- ============================================================

alter table public.tasks
  add column if not exists is_recurring boolean not null default false;

comment on column public.tasks.is_recurring is
  'When true, completing this task creates the next instance due on the next working day (Mon-Fri).';
