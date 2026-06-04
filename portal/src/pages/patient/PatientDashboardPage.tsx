import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CASE_STATUS_LABELS } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import type { CaseRecord, CaseStatus } from '../../types/case';

function countByStatus(cases: CaseRecord[], statuses: CaseStatus[]): number {
  return cases.filter((c) => statuses.includes(c.status)).length;
}

export function PatientDashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ cases: CaseRecord[] }>('/api/patient/cases');
        if (!cancelled) setCases(data.cases ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load cases');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: cases.length,
      inProgress: countByStatus(cases, [
        'OPENED',
        'ASSIGNED',
        'IN_DESIGN',
        'PENDING_QC',
        'QC_REJECTED',
        'PENDING_CLIENT_REVIEW',
        'CLIENT_REJECTED',
      ]),
      completed: countByStatus(cases, ['APPROVED']),
      pending: countByStatus(cases, ['PENDING_PAYMENT', 'PENDING_APPROVAL']),
    }),
    [cases],
  );

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Overview of your orthodontic cases</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total cases', value: summary.total },
          { label: 'In progress', value: summary.inProgress },
          { label: 'Completed', value: summary.completed },
          { label: 'Awaiting clinic', value: summary.pending },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-700">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Recent cases</h2>
          <Link
            to="/patient/cases"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            View all
          </Link>
        </div>
        {cases.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No cases linked to your account yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {cases.slice(0, 5).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link
                  to={`/patient/cases/${c.id}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {CASE_STATUS_LABELS[c.status]}
                </Link>
                <span className="text-xs text-muted">
                  {new Date(c.updatedAt ?? c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
