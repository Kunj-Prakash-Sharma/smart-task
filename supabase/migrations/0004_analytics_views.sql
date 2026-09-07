-- ============================================================
-- COMPLETION VELOCITY
-- ============================================================

create or replace view public.analytics_task_completion_velocity
with (security_invoker = true)
as
select
  coalesce(
    t.assigned_to,
    t.created_by
  ) as user_id,

  (t.completed_at at time zone 'UTC')::date
    as completion_date,

  count(*)::integer
    as completed_tasks,

  coalesce(
    sum(t.actual_minutes),
    0
  )::integer
    as actual_minutes,

  round(
    avg(
      coalesce(
        t.actual_minutes,
        0
      )
    ),
    2
  ) as avg_actual_minutes_per_task

from public.tasks t
where
  t.status = 'completed'
  and t.completed_at is not null

group by
  coalesce(
    t.assigned_to,
    t.created_by
  ),
  (t.completed_at at time zone 'UTC')::date;

create or replace view public.analytics_task_completion_velocity_7d
with (security_invoker = true)
as
with daily as (
  select
    coalesce(
      t.assigned_to,
      t.created_by
    ) as user_id,

    (t.completed_at at time zone 'UTC')::date
      as completion_date,

    count(*)::integer as completed_tasks

  from public.tasks t

  where
    t.status = 'completed'
    and t.completed_at is not null

  group by
    coalesce(
      t.assigned_to,
      t.created_by
    ),
    (t.completed_at at time zone 'UTC')::date
)

select
  d.user_id,
  d.completion_date,
  d.completed_tasks,

  sum(d.completed_tasks)
    over (
      partition by d.user_id
      order by d.completion_date
      range between interval '6 days' preceding
      and current row
    ) as completed_tasks_7d,

  round(
    (
      sum(d.completed_tasks)
      over (
        partition by d.user_id
        order by d.completion_date
        range between interval '6 days' preceding
        and current row
      )
    )::numeric / 7,
    2
  ) as avg_tasks_per_day_7d

from daily d;

-- ============================================================
-- FOCUS TIME
-- ============================================================

create or replace view public.analytics_task_focus_time
with (security_invoker = true)
as
select
  coalesce(
    t.assigned_to,
    t.created_by
  ) as user_id,

  count(*)::integer
    as task_count,

  coalesce(
    sum(t.actual_minutes),
    0
  )::bigint
    as total_focus_minutes,

  round(
    coalesce(
      sum(t.actual_minutes),
      0
    )::numeric / 60,
    2
  ) as total_focus_hours,

  round(
    avg(
      nullif(t.actual_minutes, 0)
    ),
    2
  ) as average_focus_minutes_per_task

from public.tasks t

group by
  coalesce(
    t.assigned_to,
    t.created_by
  );

-- ============================================================
-- PRIORITY DISTRIBUTION
-- ============================================================

create or replace view public.analytics_task_priority_distribution
with (security_invoker = true)
as
with user_priority_counts as (
  select
    coalesce(
      t.assigned_to,
      t.created_by
    ) as user_id,

    t.priority,

    count(*)::integer as task_count

  from public.tasks t

  group by
    coalesce(
      t.assigned_to,
      t.created_by
    ),
    t.priority
)

select
  user_id,
  priority,
  task_count,

  round(
    (
      task_count::numeric
      /
      nullif(
        sum(task_count)
          over (
            partition by user_id
          ),
        0
      )
    ) * 100,
    2
  ) as percentage

from user_priority_counts;

-- ============================================================
-- COMBINED DAILY PRODUCTIVITY
-- ============================================================

create or replace view public.analytics_daily_productivity
with (security_invoker = true)
as
with calendar as (
  select
    generate_series(
      current_date - interval '30 days',
      current_date,
      interval '1 day'
    )::date as day
),

completed as (
  select
    coalesce(
      t.assigned_to,
      t.created_by
    ) as user_id,

    (t.completed_at at time zone 'UTC')::date as day,

    count(*)::integer as completed_tasks,

    coalesce(
      sum(t.actual_minutes),
      0
    )::integer as focus_minutes

  from public.tasks t

  where
    t.status = 'completed'
    and t.completed_at is not null
    and t.completed_at >= current_date - interval '30 days'

  group by
    coalesce(
      t.assigned_to,
      t.created_by
    ),
    (t.completed_at at time zone 'UTC')::date
),

created as (
  select
    t.created_by as user_id,

    (t.created_at at time zone 'UTC')::date as day,

    count(*)::integer as created_tasks

  from public.tasks t

  where
    t.created_at >= current_date - interval '30 days'

  group by
    t.created_by,
    (t.created_at at time zone 'UTC')::date
)

select
  coalesce(c.user_id, cr.user_id) as user_id,

  coalesce(
    c.day,
    cr.day
  ) as day,

  coalesce(c.completed_tasks, 0)
    as completed_tasks,

  coalesce(c.focus_minutes, 0)
    as focus_minutes,

  coalesce(cr.created_tasks, 0)
    as created_tasks

from completed c

full outer join created cr
  on c.user_id = cr.user_id
 and c.day = cr.day;
