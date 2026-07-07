import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CaseList, CaseListSkeleton } from '../components/CaseList';
import { Alert } from '../components/ui';
import { CLIENT_STATUS_FILTERS } from '../lib/caseStatus';
import { api, ApiError } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import type { CaseRecord, CaseStatus } from '../types/case';

export function CasesPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as CaseStatus | null) ?? '';
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | CaseStatus>(initialStatus);
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
        if (!cancelled) setError(null);
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

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(cases, [statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cases</h1>
          <p className="mt-1 text-sm text-muted">Orthodontic case workflow</p>
        </div>
        <Link
          to="/cases/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New case
        </Link>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">
          Filter by status{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | CaseStatus)}
            className="ml-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {CLIENT_STATUS_FILTERS.map((f) => (
              <option key={f.value || 'all'} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <CaseListSkeleton />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6">
          <CaseList
            cases={paginatedItems}
            detailPath={(cid) => `/cases/${cid}`}
            pagination={{
              page,
              pageSize,
              totalItems,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </div>
      )}
    </div>
  );
}
