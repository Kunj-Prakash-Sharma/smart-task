-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- PRIVATE SCHEMA
-- Security helper functions live here.
-- Do not expose this schema through the API.
-- ============================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

-- ============================================================
-- ENUMS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'task_priority'
  ) then
    create type public.task_priority as enum (
      'low',
      'medium',
      'high',
      'urgent'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'task_status'
  ) then
    create type public.task_status as enum (
      'backlog',
      'todo',
      'in_progress',
      'completed'
    );
  end if;
end
$$;

-- ============================================================
-- USERS / PROFILE TABLE
-- ============================================================

create table if not exists public.users (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text,

  display_name text,

  avatar_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

comment on table public.users is
  'Application profile linked 1:1 to auth.users.';

-- ============================================================
-- LISTS
-- ============================================================

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),

  name text not null
    check (char_length(trim(name)) between 1 and 120),

  color text not null default '#6366F1'
    check (
      color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$'
    ),

  owner_id uuid not null
    references public.users(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),

  list_id uuid not null
    references public.lists(id)
    on delete cascade,

  title text not null
    check (char_length(trim(title)) between 1 and 500),

  description text,

  priority public.task_priority not null default 'medium',

  status public.task_status not null default 'todo',

  due_date timestamptz,

  estimated_minutes integer
    check (
      estimated_minutes is null
      or estimated_minutes >= 0
    ),

  actual_minutes integer not null default 0
    check (actual_minutes >= 0),

  dynamic_order_index numeric(30, 10) not null default 1000,

  ai_energy_score numeric(5, 2)
    check (
      ai_energy_score is null
      or (
        ai_energy_score >= 0
        and ai_energy_score <= 100
      )
    ),

  created_by uuid not null
    references public.users(id)
    on delete cascade,

  assigned_to uuid
    references public.users(id)
    on delete set null,

  completed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

comment on column public.tasks.dynamic_order_index is
  'Sortable numeric rank. Fractional indexing or sparse integer indexing can be used by the UI.';

comment on column public.tasks.ai_energy_score is
  'AI-estimated energy required to complete this task, normalized to 0-100.';

-- ============================================================
-- TAGS
-- ============================================================

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),

  name text not null
    check (char_length(trim(name)) between 1 and 80),

  color text not null default '#64748B'
    check (
      color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$'
    ),

  owner_id uuid not null
    references public.users(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique(owner_id, name)
);

-- ============================================================
-- MANY-TO-MANY TASK TAGS
-- ============================================================

create table if not exists public.task_tags (
  task_id uuid not null
    references public.tasks(id)
    on delete cascade,

  tag_id uuid not null
    references public.tags(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (task_id, tag_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_users_email
  on public.users(email);

create index if not exists idx_lists_owner_id
  on public.lists(owner_id);

create index if not exists idx_lists_owner_created_at
  on public.lists(owner_id, created_at desc);

create index if not exists idx_tasks_list_id
  on public.tasks(list_id);

create index if not exists idx_tasks_created_by
  on public.tasks(created_by);

create index if not exists idx_tasks_assigned_to
  on public.tasks(assigned_to);

create index if not exists idx_tasks_status
  on public.tasks(status);

create index if not exists idx_tasks_priority
  on public.tasks(priority);

create index if not exists idx_tasks_due_date
  on public.tasks(due_date);

create index if not exists idx_tasks_completed_at
  on public.tasks(completed_at);

create index if not exists idx_tasks_list_order
  on public.tasks(
    list_id,
    dynamic_order_index,
    created_at,
    id
  );

create index if not exists idx_tasks_list_status
  on public.tasks(list_id, status);

create index if not exists idx_task_tags_tag_id
  on public.task_tags(tag_id);

create index if not exists idx_task_tags_task_id
  on public.task_tags(task_id);

create index if not exists idx_tags_owner_id
  on public.tags(owner_id);

-- ============================================================
-- GENERIC updated_at TRIGGER
-- ============================================================

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TASK STATUS / COMPLETION TIMESTAMP TRIGGER
-- ============================================================

create or replace function private.set_task_completion_timestamp()
returns trigger
language plpgsql
as $$
begin
  if
    new.status = 'completed'
    and old.status is distinct from 'completed'
  then
    new.completed_at = now();

  elsif
    new.status <> 'completed'
    and old.status = 'completed'
  then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

-- ============================================================
-- CREATED_BY IMMUTABILITY + ASSIGNMENT / LIST AUTHORIZATION
-- ============================================================

create or replace function private.guard_task_mutation()
returns trigger
security definer
set search_path = public, private
language plpgsql
as $$
declare
  current_user_id uuid;
  old_list_owner uuid;
  new_list_owner uuid;
begin
  current_user_id := auth.uid();

  -- created_by must never change.
  if new.created_by is distinct from old.created_by then
    raise exception 'Task creator cannot be changed';
  end if;

  -- Determine old list owner.
  select owner_id
  into old_list_owner
  from public.lists
  where id = old.list_id;

  -- Determine new list owner.
  select owner_id
  into new_list_owner
  from public.lists
  where id = new.list_id;

  -- A task may only be moved between lists by:
  -- 1. original creator, or
  -- 2. owner of the old list.
  if new.list_id is distinct from old.list_id then

    if
      current_user_id is distinct from old.created_by
      and current_user_id is distinct from old_list_owner
    then
      raise exception
        'Only the task creator or list owner can move the task';
    end if;

    if new_list_owner is distinct from current_user_id then
      raise exception
        'Task can only be moved into a list owned by the acting user';
    end if;
  end if;

  -- Only creator/list owner can change assignment.
  if new.assigned_to is distinct from old.assigned_to then

    if
      current_user_id is distinct from old.created_by
      and current_user_id is distinct from old_list_owner
    then
      raise exception
        'Only the task creator or list owner can change assignment';
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================
-- AUTH -> PROFILE TRIGGER
-- Automatically creates public.users record after signup.
-- ============================================================

create or replace function public.handle_auth_user_created()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.users (
    id,
    email,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(
      excluded.display_name,
      public.users.display_name
    ),
    avatar_url = coalesce(
      excluded.avatar_url,
      public.users.avatar_url
    ),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_auth_user_created();

-- ============================================================
-- AUTH USER UPDATE -> PROFILE SYNC
-- ============================================================

create or replace function public.handle_auth_user_updated()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  update public.users
  set
    email = new.email,
    display_name = coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      display_name
    ),
    avatar_url = coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      avatar_url
    ),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated
on auth.users;

create trigger on_auth_user_updated
after update
on auth.users
for each row
execute function public.handle_auth_user_updated();

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists users_set_updated_at
on public.users;

create trigger users_set_updated_at
before update
on public.users
for each row
execute function private.set_updated_at();

drop trigger if exists lists_set_updated_at
on public.lists;

create trigger lists_set_updated_at
before update
on public.lists
for each row
execute function private.set_updated_at();

drop trigger if exists tasks_set_updated_at
on public.tasks;

create trigger tasks_set_updated_at
before update
on public.tasks
for each row
execute function private.set_updated_at();

drop trigger if exists tags_set_updated_at
on public.tags;

create trigger tags_set_updated_at
before update
on public.tags
for each row
execute function private.set_updated_at();

drop trigger if exists tasks_set_completion_timestamp
on public.tasks;

create trigger tasks_set_completion_timestamp
before update
on public.tasks
for each row
execute function private.set_task_completion_timestamp();

drop trigger if exists tasks_guard_mutation
on public.tasks;

create trigger tasks_guard_mutation
before update
on public.tasks
for each row
execute function private.guard_task_mutation();

-- ============================================================
-- PRIVATE ACCESS HELPERS
-- SECURITY DEFINER prevents circular RLS evaluation.
-- ============================================================

create or replace function private.can_access_list(
  p_list_id uuid,
  p_user_id uuid
)
returns boolean
security definer
set search_path = public, private
language sql
stable
as $$
  select exists (
    select 1
    from public.lists l
    where l.id = p_list_id
      and (
        l.owner_id = p_user_id
        or exists (
          select 1
          from public.tasks t
          where t.list_id = l.id
            and (
              t.created_by = p_user_id
              or t.assigned_to = p_user_id
            )
        )
      )
  );
$$;

create or replace function private.can_access_task(
  p_task_id uuid,
  p_user_id uuid
)
returns boolean
security definer
set search_path = public, private
language sql
stable
as $$
  select exists (
    select 1
    from public.tasks t
    join public.lists l
      on l.id = t.list_id
    where t.id = p_task_id
      and (
        l.owner_id = p_user_id
        or t.created_by = p_user_id
        or t.assigned_to = p_user_id
      )
  );
$$;

create or replace function private.can_access_tag(
  p_tag_id uuid,
  p_user_id uuid
)
returns boolean
security definer
set search_path = public, private
language sql
stable
as $$
  select exists (
    select 1
    from public.tags tg
    where tg.id = p_tag_id
      and (
        tg.owner_id = p_user_id
        or exists (
          select 1
          from public.task_tags tt
          join public.tasks t
            on t.id = tt.task_id
          join public.lists l
            on l.id = t.list_id
          where tt.tag_id = tg.id
            and (
              l.owner_id = p_user_id
              or t.created_by = p_user_id
              or t.assigned_to = p_user_id
            )
        )
      )
  );
$$;

create or replace function private.can_manage_list(
  p_list_id uuid,
  p_user_id uuid
)
returns boolean
security definer
set search_path = public, private
language sql
stable
as $$
  select exists (
    select 1
    from public.lists
    where id = p_list_id
      and owner_id = p_user_id
  );
$$;

-- ============================================================
-- FUNCTION PRIVILEGES
-- ============================================================

revoke execute
on function private.can_access_list(uuid, uuid)
from public, anon, authenticated;

revoke execute
on function private.can_access_task(uuid, uuid)
from public, anon, authenticated;

revoke execute
on function private.can_access_tag(uuid, uuid)
from public, anon, authenticated;

revoke execute
on function private.can_manage_list(uuid, uuid)
from public, anon, authenticated;
