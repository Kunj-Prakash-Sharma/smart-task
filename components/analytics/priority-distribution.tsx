'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '@/lib/constants';
import { formatPercentage } from '@/lib/utils/format';
import type { AnalyticsPriorityDistributionRow, TaskPriority } from '@/types/database';

export interface PriorityDistributionProps {
  data: AnalyticsPriorityDistributionRow[];
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#dc2626',
  high: '#ea580c',
  medium: '#2563eb',
  low: '#64748b',
};

export function PriorityDistribution({ data }: PriorityDistributionProps) {
  const sorted = [...data].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
  const total = sorted.reduce((sum, row) => sum + row.task_count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks yet to break down by priority.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="task_count"
                  nameKey="priority"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {sorted.map((row) => (
                    <Cell key={row.priority} fill={PRIORITY_COLORS[row.priority]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} task${value === 1 ? '' : 's'}`,
                    PRIORITY_LABELS[name as TaskPriority],
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => {
                    const row = sorted.find((r) => r.priority === value);
                    const label = PRIORITY_LABELS[value as TaskPriority];
                    return row ? `${label} ${formatPercentage(row.percentage)}` : label;
                  }}
                  wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
