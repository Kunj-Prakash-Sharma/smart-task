export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed';

// NOTE: these Row shapes are declared with `type`, not `interface`. Postgrest-js's
// generic helpers (GenericTable, RejectExcessProperties, ...) require Row/Insert/Update
// to structurally match `Record<string, unknown>`. Plain object type aliases get the
// implicit index signature needed for that match; named `interface` declarations do
// not, which silently collapses inferred Insert/Update argument types to `never` at
// every `.insert()`/`.update()` call site. Keep these as `type`.

export type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ListRow = {
  id: string;
  name: string;
  color: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number;
  dynamic_order_index: number;
  ai_energy_score: number | null;
  created_by: string;
  assigned_to: string | null;
  completed_at: string | null;
  recurrence_days: number[];
  external_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TagRow = {
  id: string;
  name: string;
  color: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TaskTagRow = {
  task_id: string;
  tag_id: string;
  created_at: string;
};

export type TaskWithTags = TaskRow & {
  task_tags: Array<{
    tag_id: string;
    tags: TagRow;
  }>;
};

export type AnalyticsCompletionVelocityRow = {
  user_id: string;
  completion_date: string;
  completed_tasks: number;
  actual_minutes: number;
  avg_actual_minutes_per_task: number;
};

export type AnalyticsCompletionVelocity7dRow = {
  user_id: string;
  completion_date: string;
  completed_tasks: number;
  completed_tasks_7d: number;
  avg_tasks_per_day_7d: number;
};

export type AnalyticsFocusTimeRow = {
  user_id: string;
  task_count: number;
  total_focus_minutes: number;
  total_focus_hours: number;
  average_focus_minutes_per_task: number | null;
};

export type AnalyticsPriorityDistributionRow = {
  user_id: string;
  priority: TaskPriority;
  task_count: number;
  percentage: number;
};

export type AnalyticsDailyProductivityRow = {
  user_id: string;
  day: string;
  completed_tasks: number;
  focus_minutes: number;
  created_tasks: number;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & { id: string };
        Update: Partial<UserRow>;
        Relationships: [];
      };
      lists: {
        Row: ListRow;
        Insert: Partial<ListRow> & { name: string; owner_id: string };
        Update: Partial<ListRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Partial<TaskRow> & {
          list_id: string;
          title: string;
          created_by: string;
        };
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: Partial<TagRow> & { name: string; owner_id: string };
        Update: Partial<TagRow>;
        Relationships: [];
      };
      task_tags: {
        Row: TaskTagRow;
        Insert: TaskTagRow;
        Update: Partial<TaskTagRow>;
        Relationships: [];
      };
    };
    Views: {
      analytics_task_completion_velocity: {
        Row: AnalyticsCompletionVelocityRow;
        Relationships: [];
      };
      analytics_task_completion_velocity_7d: {
        Row: AnalyticsCompletionVelocity7dRow;
        Relationships: [];
      };
      analytics_task_focus_time: {
        Row: AnalyticsFocusTimeRow;
        Relationships: [];
      };
      analytics_task_priority_distribution: {
        Row: AnalyticsPriorityDistributionRow;
        Relationships: [];
      };
      analytics_daily_productivity: {
        Row: AnalyticsDailyProductivityRow;
        Relationships: [];
      };
    };
    Functions: {
      reorder_tasks: {
        Args: { p_list_id: string; p_task_ids: string[] };
        Returns: TaskRow[];
      };
    };
  };
};
