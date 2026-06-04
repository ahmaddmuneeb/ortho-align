import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaseForm } from '../components/CaseForm';
import { api, ApiError } from '../lib/api';
import type { CaseRecord } from '../types/case';
import type { Patient, PatientsListResponse } from '../types/patient';

export function CaseNewPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const handleSubmit = async (patientId: string, notes: string) => {
    setApiError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>('/api/cases', {
        patientId,
        notes: notes || undefined,
      });
      navigate(`/cases/${data.case.id}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to create case');
      throw err;
    }
  };

  return (
    <div>
      <Link to="/cases" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to cases
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">New case</h1>
      <p className="mt-1 text-sm text-muted">Start a case in pending payment status</p>

      {loading && <p className="mt-6 text-muted">Loading patients…</p>}
      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-muted">Add a patient before creating a case.</p>
          <Link
            to="/patients/new"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Add patient
          </Link>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="mt-6">
          <CaseForm
            patients={patients}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/cases')}
            apiError={apiError}
          />
        </div>
      )}
    </div>
  );
}
