import { useEffect, useState } from 'react';
import { CaseList, CaseListSkeleton } from '../../components/CaseList';
import { api, ApiError } from '../../lib/api';
import type { CaseRecord, CaseStatus } from '../../types/case';

const ADMIN_FILTERS: { value: '' | CaseStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'OPENED', label: 'Opened' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_DESIGN', label: 'In design' },
];

export function AdminCasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | CaseStatus>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = statusFilter ? `?status=${statusFilter}` : '';
        const data = await api.get<{ cases: CaseRecord[] }>(`/api/cases${qs}`);
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
  }, [statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">All cases</h1>
      <p className="mt-1 text-sm text-muted">Approve payments and assign staff</p>

      <div className="mt-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | CaseStatus)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          {ADMIN_FILTERS.map((f) => (
            <option key={f.value || 'all'} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <CaseListSkeleton />}
      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="mt-6">
          <CaseList cases={cases} detailPath={(id) => `/admin/cases/${id}`} />
        </div>
      )}
    </div>
  );
}
