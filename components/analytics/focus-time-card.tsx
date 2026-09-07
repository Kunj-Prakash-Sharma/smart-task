import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMinutes } from '@/lib/utils/format';
import type { AnalyticsFocusTimeRow } from '@/types/database';

export interface FocusTimeCardProps {
  data: AnalyticsFocusTimeRow | null;
}

function formatHours(hours: number): string {
  if (Number.isInteger(hours)) {
    return `${hours}h`;
  }
  return `${hours.toFixed(1)}h`;
}

export function FocusTimeCard({ data }: FocusTimeCardProps) {
  const totalHours = data?.total_focus_hours ?? 0;
  const taskCount = data?.task_count ?? 0;
  const averageMinutes = data?.average_focus_minutes_per_task ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Focus time</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {formatHours(totalHours)}
        </p>
        <div className="mt-4 flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Total tasks</p>
            <p className="text-sm font-medium text-foreground">{taskCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. per task</p>
            <p className="text-sm font-medium text-foreground">{formatMinutes(averageMinutes)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
