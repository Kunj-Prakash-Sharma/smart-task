-- ============================================================
-- REORDER RPC
-- Transaction-safe drag-and-drop reordering.
-- ============================================================

create or replace function public.reorder_tasks(
  p_list_id uuid,
  p_task_ids uuid[]
)
returns setof public.tasks
language plpgsql
security invoker
as $$
declare
  i integer;
  task_count integer;
begin

  if not private.can_manage_list(
    p_list_id,
    auth.uid()
  ) then
    raise exception 'You do not own this list';
  end if;

  if p_task_ids is null then
    raise exception 'Task ID array cannot be null';
  end if;

  task_count := coalesce(
    array_length(p_task_ids, 1),
    0
  );

  if task_count = 0 then
    return;
  end if;

  -- Prevent duplicate task IDs.
  if (
    select count(*)
    from (
      select distinct unnest(p_task_ids) as id
    ) unique_ids
  ) <> task_count then
    raise exception 'Duplicate task IDs are not allowed';
  end if;

  -- Every task must belong to this list.
  if (
    select count(*)
    from public.tasks t
    where t.list_id = p_list_id
      and t.id = any(p_task_ids)
  ) <> task_count then
    raise exception
      'All reordered tasks must belong to the target list';
  end if;

  -- Sparse order spacing:
  -- 65,536 keeps plenty of room for inserting between rows.
  for i in 1..task_count loop
    update public.tasks
    set dynamic_order_index = i * 65536
    where id = p_task_ids[i]
      and list_id = p_list_id;
  end loop;

  return query
  select *
  from public.tasks
  where list_id = p_list_id
  order by
    dynamic_order_index,
    created_at,
    id;
end;
$$;

revoke execute on function public.reorder_tasks(uuid, uuid[])
from anon;

grant execute on function public.reorder_tasks(uuid, uuid[])
to authenticated;
