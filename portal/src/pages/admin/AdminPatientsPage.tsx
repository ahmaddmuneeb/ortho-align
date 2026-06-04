import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { Alert } from '../../components/ui';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { patientInputClass } from '../../components/PatientForm';
import { api, ApiError } from '../../lib/api';
import { sanitizeSearchQuery } from '../../lib/sanitize';
import { formatDisplayDate } from '../../lib/patientDates';
import { usePagination } from '../../lib/usePagination';
import type { Gender } from '../../types/auth';
import type { Patient, PatientsListResponse } from '../../types/patient';

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

function clientLabel(p: Patient): string {
  if (!p.createdBy) return '—';
  return `${p.createdBy.name} (${p.createdBy.email})`;
}

export function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<PatientsListResponse>('/api/patients');
        if (!cancelled) setPatients(data.patients ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load patients');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = sanitizeSearchQuery(search).toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const client = p.createdBy;
      return (
        p.name.toLowerCase().includes(q) ||
        (client?.name.toLowerCase().includes(q) ?? false) ||
        (client?.email.toLowerCase().includes(q) ?? false)
      );
    });
  }, [patients, search]);

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(filtered, [search]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Patients</h1>
          <p className="mt-1 text-sm text-muted">All patient records across clients</p>
        </div>
        <Link
          to="/admin/patients/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add patient
        </Link>
      </div>

      <label className="mt-6 flex min-w-[10rem] max-w-md flex-col text-sm font-medium text-slate-700">
        Search
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Patient or client name/email…"
            className={`${patientInputClass} pl-9`}
          />
        </div>
      </label>

      {loading && <SkeletonTable rows={8} cols={5} className="mt-6" />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-6 py-6">
              <Alert variant="info">
                {patients.length === 0 ? 'No patients yet.' : 'No patients match your search.'}
              </Alert>
            </div>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to={`/admin/patients/${p.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{clientLabel(p)}</td>
                      <td className="px-4 py-3 text-muted">
                        {p.gender ? GENDER_LABELS[p.gender] : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDisplayDate(p.dateOfBirth)}
                      </td>
                      <td className="px-4 py-3 text-muted">{p.cases?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-slate-100 md:hidden">
                {paginatedItems.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <Link
                      to={`/admin/patients/${p.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">{clientLabel(p)}</p>
                    <p className="text-xs text-muted">
                      {p.gender ? GENDER_LABELS[p.gender] : '—'} · DOB{' '}
                      {formatDisplayDate(p.dateOfBirth)} · {p.cases?.length ?? 0} case
                      {(p.cases?.length ?? 0) === 1 ? '' : 's'}
                    </p>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
