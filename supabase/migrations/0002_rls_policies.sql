-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.users enable row level security;
alter table public.lists enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;

-- ============================================================
-- TABLE GRANTS
-- ============================================================

revoke all on public.users from anon;
revoke all on public.lists from anon;
revoke all on public.tasks from anon;
revoke all on public.tags from anon;
revoke all on public.task_tags from anon;

grant select, insert, update, delete
on public.users
to authenticated;

grant select, insert, update, delete
on public.lists
to authenticated;

grant select, insert, update, delete
on public.tasks
to authenticated;

grant select, insert, update, delete
on public.tags
to authenticated;

grant select, insert, update, delete
on public.task_tags
to authenticated;

-- ============================================================
-- USERS POLICIES
-- ============================================================

drop policy if exists users_select_own
on public.users;

create policy users_select_own
on public.users
for select
to authenticated
using (
  id = auth.uid()
);

drop policy if exists users_insert_own
on public.users;

create policy users_insert_own
on public.users
for insert
to authenticated
with check (
  id = auth.uid()
);

drop policy if exists users_update_own
on public.users;

create policy users_update_own
on public.users
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

drop policy if exists users_delete_own
on public.users;

create policy users_delete_own
on public.users
for delete
to authenticated
using (
  id = auth.uid()
);

-- ============================================================
-- LISTS
-- ============================================================

-- Owner and users who have an assigned/created task
-- can read the list metadata.

drop policy if exists lists_select_accessible
on public.lists;

create policy lists_select_accessible
on public.lists
for select
to authenticated
using (
  private.can_access_list(
    id,
    auth.uid()
  )
);

-- Only list owner can create a list.

drop policy if exists lists_insert_owner
on public.lists;

create policy lists_insert_owner
on public.lists
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

-- Only owner can update.

drop policy if exists lists_update_owner
on public.lists;

create policy lists_update_owner
on public.lists
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);

-- Only owner can delete.

drop policy if exists lists_delete_owner
on public.lists;

create policy lists_delete_owner
on public.lists
for delete
to authenticated
using (
  owner_id = auth.uid()
);

-- ============================================================
-- TASKS
-- ============================================================

drop policy if exists tasks_select_accessible
on public.tasks;

create policy tasks_select_accessible
on public.tasks
for select
to authenticated
using (
  private.can_access_task(
    id,
    auth.uid()
  )
);

-- New tasks can only be created in lists owned by
-- the acting user.

drop policy if exists tasks_insert_list_owner
on public.tasks;

create policy tasks_insert_list_owner
on public.tasks
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.owner_id = auth.uid()
  )
);

-- User can update an accessible task.
-- The trigger additionally prevents privilege-escalating
-- reassignment/list moves.

drop policy if exists tasks_update_accessible
on public.tasks;

create policy tasks_update_accessible
on public.tasks
for update
to authenticated
using (
  private.can_access_task(
    id,
    auth.uid()
  )
)
with check (
  created_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.owner_id = auth.uid()
  )
);

-- Any user with task access may delete.
-- For a stricter enterprise policy, restrict this to creator/list owner.

drop policy if exists tasks_delete_accessible
on public.tasks;

create policy tasks_delete_accessible
on public.tasks
for delete
to authenticated
using (
  private.can_access_task(
    id,
    auth.uid()
  )
);

-- ============================================================
-- TAGS
-- ============================================================

drop policy if exists tags_select_accessible
on public.tags;

create policy tags_select_accessible
on public.tags
for select
to authenticated
using (
  private.can_access_tag(
    id,
    auth.uid()
  )
);

drop policy if exists tags_insert_owner
on public.tags;

create policy tags_insert_owner
on public.tags
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

drop policy if exists tags_update_owner
on public.tags;

create policy tags_update_owner
on public.tags
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);

drop policy if exists tags_delete_owner
on public.tags;

create policy tags_delete_owner
on public.tags
for delete
to authenticated
using (
  owner_id = auth.uid()
);

-- ============================================================
-- TASK_TAGS
-- ============================================================

drop policy if exists task_tags_select_accessible
on public.task_tags;

create policy task_tags_select_accessible
on public.task_tags
for select
to authenticated
using (
  private.can_access_task(task_id, auth.uid())
  and private.can_access_tag(tag_id, auth.uid())
);

drop policy if exists task_tags_insert_accessible
on public.task_tags;

create policy task_tags_insert_accessible
on public.task_tags
for insert
to authenticated
with check (
  private.can_access_task(task_id, auth.uid())
  and private.can_access_tag(tag_id, auth.uid())
);

drop policy if exists task_tags_update_accessible
on public.task_tags;

create policy task_tags_update_accessible
on public.task_tags
for update
to authenticated
using (
  private.can_access_task(task_id, auth.uid())
  and private.can_access_tag(tag_id, auth.uid())
)
with check (
  private.can_access_task(task_id, auth.uid())
  and private.can_access_tag(tag_id, auth.uid())
);

drop policy if exists task_tags_delete_accessible
on public.task_tags;

create policy task_tags_delete_accessible
on public.task_tags
for delete
to authenticated
using (
  private.can_access_task(task_id, auth.uid())
  and private.can_access_tag(tag_id, auth.uid())
);
