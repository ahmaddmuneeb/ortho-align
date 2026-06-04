import { useEffect, useMemo, useState } from 'react';
import { CaseList, CaseListSkeleton } from '../../components/CaseList';
import { Alert } from '../../components/ui';
import { CLIENT_STATUS_FILTERS } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import { usePagination } from '../../lib/usePagination';
import type { CaseRecord, CaseStatus } from '../../types/case';

export function PatientCasesPage() {
  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | CaseStatus>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{ cases: CaseRecord[] }>('/api/patient/cases');
        if (!cancelled) {
          setAllCases(data.cases ?? []);
          setError(null);
        }
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

  const cases = useMemo(
    () =>
      statusFilter
        ? allCases.filter((c) => c.status === statusFilter)
        : allCases,
    [allCases, statusFilter],
  );

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
      <h1 className="text-2xl font-semibold text-ink">My cases</h1>
      <p className="mt-1 text-sm text-muted">Read-only view of your treatment cases</p>

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
            detailPath={(id) => `/patient/cases/${id}`}
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
