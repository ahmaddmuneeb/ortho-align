import type { AdminDashboardStats } from '../../lib/adminDashboard';
import { SkeletonCard } from '../ui/Skeleton';

interface DashboardChartsProps {
  statusBreakdown: AdminDashboardStats['statusBreakdown'];
  casesLast7Days: AdminDashboardStats['casesLast7Days'];
  loading?: boolean;
}

const BAR_COLORS = [
  'bg-brand-500',
  'bg-brand-600',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-teal-600',
  'bg-slate-400',
  'bg-slate-500',
];

export function DashboardCharts({
  statusBreakdown,
  casesLast7Days,
  loading = false,
}: DashboardChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const maxStatus = Math.max(...statusBreakdown.map((s) => s.count), 1);
  const maxTrend = Math.max(...casesLast7Days.map((d) => d.count), 1);
  const trendTotal = casesLast7Days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Cases by status</h2>
        <p className="mt-1 text-sm text-muted">Active pipeline breakdown</p>

        {statusBreakdown.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">No cases yet.</p>
        ) : (
          <ul className="mt-6 space-y-3" role="list">
            {statusBreakdown.map((row, i) => (
              <li key={row.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-medium tabular-nums text-ink">{row.count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${(row.count / maxStatus) * 100}%` }}
                    role="presentation"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">New cases — last 7 days</h2>
            <p className="mt-1 text-sm text-muted">Created by day</p>
          </div>
          <p className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            {trendTotal} total
          </p>
        </div>

        {trendTotal === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            No new cases in the last 7 days.
          </p>
        ) : (
          <div className="mt-8 flex items-end justify-between gap-2 sm:gap-3">
            {casesLast7Days.map((day) => (
              <div
                key={day.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-medium tabular-nums text-brand-700">
                  {day.count > 0 ? day.count : ''}
                </span>
                <div className="flex w-full items-end justify-center" style={{ height: '7rem' }}>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                    style={{
                      height: `${Math.max((day.count / maxTrend) * 100, day.count > 0 ? 8 : 0)}%`,
                      minHeight: day.count > 0 ? '0.5rem' : 0,
                    }}
                    title={`${day.label}: ${day.count}`}
                    role="presentation"
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] leading-tight text-muted sm:text-xs">
                  {day.label.split(',')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
