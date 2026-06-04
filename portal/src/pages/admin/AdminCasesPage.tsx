import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { CaseList, CaseListSkeleton } from '../../components/CaseList';
import { Alert } from '../../components/ui';
import { patientInputClass } from '../../components/PatientForm';
import { ADMIN_STATUS_FILTERS } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import { sanitizeSearchQuery } from '../../lib/sanitize';
import { usePagination } from '../../lib/usePagination';
import type { CaseRecord, CaseStatus } from '../../types/case';

function matchesSearch(c: CaseRecord, query: string): boolean {
  const q = sanitizeSearchQuery(query).toLowerCase();
  if (!q) return true;
  const parts = [
    c.id,
    c.patient?.name,
    c.patientId,
    c.createdBy?.name,
    c.createdBy?.email,
  ];
  return parts.some((p) => p?.toLowerCase().includes(q));
}

const VALID_STATUSES = new Set<CaseStatus>(
  ADMIN_STATUS_FILTERS.map((f) => f.value).filter(Boolean) as CaseStatus[],
);

export function AdminCasesPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | CaseStatus>(() =>
    initialStatus && VALID_STATUSES.has(initialStatus as CaseStatus)
      ? (initialStatus as CaseStatus)
      : '',
  );
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = statusFilter ? `?status=${statusFilter}` : '';
        const data = await api.get<{ cases: CaseRecord[] }>(`/api/cases${qs}`);
        if (!cancelled) {
          setCases(data.cases ?? []);
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
  }, [statusFilter]);

  const filteredCases = useMemo(
    () => cases.filter((c) => matchesSearch(c, search)),
    [cases, search],
  );

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(filteredCases, [search, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">All cases</h1>
          <p className="mt-1 text-sm text-muted">Approve payments, assign staff, manage workflow</p>
        </div>
        <Link
          to="/admin/cases/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New case
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | CaseStatus)}
            className={`${patientInputClass} mt-1`}
          >
            {ADMIN_STATUS_FILTERS.map((f) => (
              <option key={f.value || 'all'} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1 text-sm font-medium text-slate-700 sm:min-w-[200px]">
          Search
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Patient, client, or case ID"
              className={`${patientInputClass} pl-9`}
            />
          </div>
        </label>
      </div>

      {loading && <CaseListSkeleton variant="admin" />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {!loading && !error && (
        <div className="mt-6">
          <CaseList
            cases={paginatedItems}
            detailPath={(id) => `/admin/cases/${id}`}
            variant="admin"
            emptyMessage={
              search.trim()
                ? 'No cases match your search.'
                : 'No cases found.'
            }
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
