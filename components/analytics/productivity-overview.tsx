'use client';

import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsDailyProductivityRow } from '@/types/database';

export interface ProductivityOverviewProps {
  data: AnalyticsDailyProductivityRow[];
}

const CREATED_COLOR = '#eb6834';
const COMPLETED_COLOR = '#2a78d6';
const AXIS_COLOR = '#898781';
const GRID_COLOR = 'rgba(136,134,129,0.2)';

function formatTick(value: string): string {
  return format(parseISO(value), 'MMM d');
}

export function ProductivityOverview({ data }: ProductivityOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Created vs. completed</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Create or complete a task to see this breakdown.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="day"
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
                <Bar dataKey="created_tasks" name="Created" fill={CREATED_COLOR} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="completed_tasks"
                  name="Completed"
                  fill={COMPLETED_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
