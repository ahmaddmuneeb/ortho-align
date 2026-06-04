import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CaseList, CaseListSkeleton } from '../../components/CaseList';
import { EMPLOYEE_STATUS_FILTERS } from '../../lib/caseStatus';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import type { CaseRecord, CaseStatus } from '../../types/case';

export function EmployeeQueuePage() {
  const { user } = useAuth();
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
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="mt-6">
          <CaseList
            cases={cases}
            detailPath={(id) => `/employee/cases/${id}`}
            emptyMessage="No cases in your queue."
          />
        </div>
      )}
    </div>
  );
}
