import type { ReactNode } from 'react';
import { SkeletonStatCard } from '../ui/Skeleton';

type Accent = 'brand' | 'amber' | 'sky' | 'emerald' | 'violet' | 'slate';

const accentStyles: Record<Accent, { icon: string; value: string }> = {
  brand: { icon: 'bg-brand-100 text-brand-700', value: 'text-brand-700' },
  amber: { icon: 'bg-amber-100 text-amber-700', value: 'text-amber-700' },
  sky: { icon: 'bg-sky-100 text-sky-700', value: 'text-sky-700' },
  emerald: { icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-700' },
  violet: { icon: 'bg-violet-100 text-violet-700', value: 'text-violet-700' },
  slate: { icon: 'bg-slate-100 text-slate-600', value: 'text-ink' },
};

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: Accent;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'brand',
  loading = false,
}: StatCardProps) {
  const styles = accentStyles[accent];

  if (loading) {
    return <SkeletonStatCard />;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className={`mt-2 text-3xl font-semibold tabular-nums ${styles.value}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
