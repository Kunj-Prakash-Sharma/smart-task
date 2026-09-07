'use client';

import { format, parseISO } from 'date-fns';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsCompletionVelocity7dRow } from '@/types/database';

export interface CompletionChartProps {
  data: AnalyticsCompletionVelocity7dRow[];
}

const DAILY_COLOR = '#2a78d6';
const ROLLING_COLOR = '#eb6834';
const AXIS_COLOR = '#898781';
const GRID_COLOR = 'rgba(136,134,129,0.2)';

function formatTick(value: string): string {
  return format(parseISO(value), 'MMM d');
}

export function CompletionChart({ data }: CompletionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion velocity</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Complete a task to see your velocity here.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="completion_date"
                  tickFormatter={formatTick}
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  labelFormatter={(value: string) => formatTick(value)}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="completed_tasks"
                  name="Completed"
                  fill={DAILY_COLOR}
                  stroke={DAILY_COLOR}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completed_tasks_7d"
                  name="7-day avg"
                  stroke={ROLLING_COLOR}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
