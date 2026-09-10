-- ============================================================
-- FLEXIBLE TASK RECURRENCE (replaces the working-day-only toggle)
-- ============================================================

alter table public.tasks
  add column if not exists recurrence_days smallint[] not null default '{}';

alter table public.tasks
  add constraint tasks_recurrence_days_valid
  check (recurrence_days <@ array[0,1,2,3,4,5,6]::smallint[]);

comment on column public.tasks.recurrence_days is
  'Days of week (0=Sunday..6=Saturday) this task repeats on when completed. Empty array means it does not repeat.';

-- Preserve existing "repeat every working day" tasks as Mon-Fri.
update public.tasks
  set recurrence_days = array[1,2,3,4,5]::smallint[]
  where is_recurring = true;

alter table public.tasks drop column is_recurring;
