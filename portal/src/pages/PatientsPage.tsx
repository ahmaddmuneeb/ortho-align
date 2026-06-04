import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { formatDisplayDate } from '../lib/patientDates';
import type { Gender } from '../types/auth';
import type { Patient, PatientsListResponse } from '../types/patient';

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

function PatientListSkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading patients">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Patients</h1>
          <p className="mt-1 text-sm text-muted">Patient records for your practice</p>
        </div>
        <Link
          to="/patients/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Add patient
        </Link>
      </div>

      {loading && <PatientListSkeleton />}
      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-muted">No patients yet.</p>
          <Link
            to="/patients/new"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Add your first patient
          </Link>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Date of birth</th>
                  <th className="px-4 py-3">Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
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
          </div>

          <ul className="mt-6 space-y-3 md:hidden">
            {patients.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/patients/${p.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300"
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
        </>
      )}
    </div>
  );
}
