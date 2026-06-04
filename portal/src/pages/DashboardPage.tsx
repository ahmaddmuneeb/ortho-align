import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { DashboardStats } from '../types/auth';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ stats: DashboardStats }>('/api/dashboard');
        if (!cancelled) setStats(data.stats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total patients', value: stats.totalPatients },
    { label: 'Total cases', value: stats.totalCases },
    { label: 'Cases this month', value: stats.casesThisMonth },
    { label: 'Total refinements', value: stats.totalRefinements },
    { label: 'Refinements this month', value: stats.refinementsThisMonth },
  ];

  const statusRows = [
    { label: 'Pending payment', value: stats.casesByStatus.pendingPayment },
    { label: 'In design review', value: stats.casesByStatus.inDesignReview },
    { label: 'In QC review', value: stats.casesByStatus.inQcReview },
    { label: 'Approval required', value: stats.casesByStatus.approvalRequired },
    { label: 'Completed', value: stats.casesByStatus.completed },
    { label: 'Cancelled', value: stats.casesByStatus.cancelled },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Overview of your practice activity</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-700">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-ink">Cases by status</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {statusRows.map((row) => (
            <li key={row.label} className="flex justify-between py-3 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
