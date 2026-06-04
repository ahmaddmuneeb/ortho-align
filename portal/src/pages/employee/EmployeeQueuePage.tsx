import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CaseList, CaseListSkeleton } from '../../components/CaseList';
import { Alert } from '../../components/ui';
import { EMPLOYEE_STATUS_FILTERS } from '../../lib/caseStatus';
import { useAppSelector } from '../../store/hooks';
import { api, ApiError } from '../../lib/api';
import { usePagination } from '../../lib/usePagination';
import type { CaseRecord, CaseStatus } from '../../types/case';

export function EmployeeQueuePage() {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const isQcRoute = location.pathname.includes('/qc');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | CaseStatus>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const title =
    user?.employeeType === 'BOTH'
      ? isQcRoute
        ? 'QC queue'
        : 'Designer queue'
      : user?.employeeType === 'QC'
        ? 'QC queue'
        : 'Designer queue';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        const qs = params.toString() ? `?${params}` : '';
        const data = await api.get<{ cases: CaseRecord[] }>(`/api/employee/cases${qs}`);
        let list = data.cases ?? [];
        if (user?.employeeType === 'BOTH') {
          if (isQcRoute) {
            list = list.filter((c) => c.qcId === user.id);
          } else {
            list = list.filter((c) => c.designerId === user.id);
          }
        }
        if (!cancelled) {
          setCases(list);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load queue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, isQcRoute, user?.id, user?.employeeType]);

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(cases, [statusFilter, isQcRoute]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-muted">Cases assigned to you</p>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">
          Status{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | CaseStatus)}
            className="ml-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {EMPLOYEE_STATUS_FILTERS.map((f) => (
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
            detailPath={(id) => `/employee/cases/${id}`}
            emptyMessage="No cases in your queue."
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
