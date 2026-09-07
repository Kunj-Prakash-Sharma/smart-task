-- ============================================================
-- EXTERNAL LINK ON TASKS (Jira/Trello/etc.)
-- A manually-pasted link to an item in another tool. Opened in a new
-- tab client-side whenever the task is marked completed.
-- ============================================================

alter table public.tasks
  add column if not exists external_url text;

alter table public.tasks
  add constraint tasks_external_url_http_check
  check (external_url is null or external_url ~* '^https?://');

comment on column public.tasks.external_url is
  'Optional manually-pasted link to an external board/issue (Jira, Trello, etc.). Opened in a new tab when the task is marked completed.';
