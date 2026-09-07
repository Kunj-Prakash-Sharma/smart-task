import { BarChart3 } from 'lucide-react';
import { CompletionChart } from '@/components/analytics/completion-chart';
import { FocusTimeCard } from '@/components/analytics/focus-time-card';
import { PriorityDistribution } from '@/components/analytics/priority-distribution';
import { ProductivityOverview } from '@/components/analytics/productivity-overview';
import { PageHeader } from '@/components/shared/page-header';
import {
  getCompletionVelocity7d,
  getDailyProductivity,
  getFocusTime,
  getPriorityDistribution,
} from '@/lib/data/analytics';

export default async function AnalyticsPage() {
  const [focusTime, priorityDistribution, completionVelocity, dailyProductivity] =
    await Promise.all([
      getFocusTime(),
      getPriorityDistribution(),
      getCompletionVelocity7d(),
      getDailyProductivity(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={BarChart3} title="Analytics" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FocusTimeCard data={focusTime} />
        <PriorityDistribution data={priorityDistribution} />
        <CompletionChart data={completionVelocity} />
        <ProductivityOverview data={dailyProductivity} />
      </div>
    </div>
  );
}
