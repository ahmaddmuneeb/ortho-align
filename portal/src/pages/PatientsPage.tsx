import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/ui';
import { SkeletonTable } from '../components/ui/Skeleton';
import { api, ApiError } from '../lib/api';
import { formatDisplayDate } from '../lib/patientDates';
import { usePagination } from '../lib/usePagination';
import type { Gender } from '../types/auth';
import type { Patient, PatientsListResponse } from '../types/patient';

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(patients);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Patients</h1>
          <p className="mt-1 text-sm text-muted">Patient records for your practice</p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add patient
        </Link>
      </div>

      {loading && <SkeletonTable rows={8} cols={4} className="mt-6" />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <Alert variant="info" title="No patients yet">
            <span className="text-muted">Add your first patient to get started.</span>
          </Alert>
          <Link
            to="/patients/new"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add your first patient
          </Link>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Date of birth</th>
                <th className="px-4 py-3">Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
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
              <li key={p.id}>
                <Link
                  to={`/patients/${p.id}`}
                  className="block p-4 hover:bg-slate-50/80"
                >
                  <p className="font-medium text-brand-700">{p.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.gender ? GENDER_LABELS[p.gender] : 'Gender not specified'} · DOB{' '}
                    {formatDisplayDate(p.dateOfBirth)}
                  </p>
                  {(p.cases?.length ?? 0) > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      {p.cases!.length} case{p.cases!.length === 1 ? '' : 's'}
                    </p>
                  )}
                </Link>
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
        </div>
      )}
    </div>
  );
}
