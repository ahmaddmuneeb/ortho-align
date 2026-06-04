import type { HTMLAttributes } from 'react';

const baseClass = 'animate-pulse rounded bg-slate-200';

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${baseClass} ${className}`.trim()} aria-hidden {...props} />;
}

export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()} aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-4/5 max-w-xs' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
      aria-busy="true"
    >
      <Skeleton className="h-5 w-36" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`.trim()}
      aria-busy="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className = '',
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex md:gap-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1 max-w-[8rem]" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-3 px-4 py-4">
            {Array.from({ length: cols }, (_, col) => (
              <Skeleton
                key={col}
                className={`h-4 flex-1 ${col === 0 ? 'max-w-[6rem]' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({
  fields = 4,
  className = '',
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`.trim()} aria-busy="true" aria-label="Loading form">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

/** Profile / detail page with sidebar + form layout */
export function SkeletonProfilePage() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading profile">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <div className="mt-6">
            <SkeletonForm fields={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Case detail: header + stacked sections */
export function SkeletonCaseDetail({ sections = 4 }: { sections?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading case">
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Patient dashboard: stat row + recent list */
export function SkeletonDashboard() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="mt-8">
        <SkeletonCard />
      </div>
    </div>
  );
}
