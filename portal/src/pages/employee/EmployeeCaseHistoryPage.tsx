import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { EMPLOYEE_STATUS_FILTERS, formatCaseVersion } from '../../lib/caseStatus';
import { assignedDate, caseTypeLabel, completedDate, filterAndSortHistory } from '../../lib/employeeHistory';
import { api, ApiError } from '../../lib/api';
import { usePagination } from '../../lib/usePagination';
import { Alert } from '../../components/ui';
import { CaseListSkeleton } from '../../components/CaseList';
import { Pagination } from '../../components/Pagination';
import type { CaseRecord } from '../../types/case';
import type { HistorySortKey } from '../../lib/employeeHistory';

export function EmployeeCaseHistoryPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [sortKey, setSortKey] = useState<HistorySortKey>('updated');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ cases: CaseRecord[] }>('/api/employee/cases');
        if (!cancelled) setCases(data.cases ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load case history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const doctors = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cases) {
      if (c.createdById && c.createdBy?.name) map.set(c.createdById, c.createdBy.name);
    }
    return Array.from(map.entries());
  }, [cases]);

  const filtered = useMemo(
    () => filterAndSortHistory(cases, { search, status, doctorId, sortKey }),
    [cases, search, status, doctorId, sortKey],
  );

  const { page, pageSize, totalItems, paginatedItems, setPage, setPageSize } = usePagination(
    filtered,
    [search, status, doctorId, sortKey],
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Case history</h1>
      <p className="mt-1 text-sm text-muted">
        Every case ever assigned to you — search, filter, and sort to track your workload.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-slate-700">
          Search
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Patient, doctor, or case ID"
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {EMPLOYEE_STATUS_FILTERS.map((f) => (
              <option key={f.value || 'all'} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All doctors</option>
            {doctors.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as HistorySortKey)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="updated">Last updated</option>
            <option value="assigned">Date assigned</option>
            <option value="status">Status</option>
            <option value="caseId">Case ID</option>
          </select>
        </label>
      </div>

      {loading && <CaseListSkeleton variant="admin" />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Case ID</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted">
                      No cases match your filters.
                    </td>
                  </tr>
                )}
                {paginatedItems.map((c) => {
                  const assigned = assignedDate(c);
                  const completed = completedDate(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to={`/employee/cases/${c.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {c.patient?.name ?? c.patientId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{c.createdBy?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{caseTypeLabel(c)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {formatCaseVersion(c)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {c.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {assigned ? new Date(assigned).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {completed ? new Date(completed).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(c.updatedAt ?? c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
