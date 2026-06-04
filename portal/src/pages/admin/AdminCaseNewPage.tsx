import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaseForm } from '../../components/CaseForm';
import { Alert } from '../../components/ui';
import { SkeletonForm } from '../../components/ui/Skeleton';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import type { CaseRecord } from '../../types/case';
import type { Patient, PatientsListResponse } from '../../types/patient';

function patientOptionLabel(p: Patient): string {
  const client = p.createdBy?.name;
  return client ? `${p.name} — ${client}` : p.name;
}

export function AdminCaseNewPage() {
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
      toast.success('Case created');
      navigate(`/admin/cases/${data.case.id}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to create case');
      throw err;
    }
  };

  return (
    <div>
      <Link to="/admin/cases" className="text-sm font-medium text-brand-700 hover:underline">
        ← All cases
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">New case</h1>
      <p className="mt-1 text-sm text-muted">
        Create a case for any patient (starts in pending payment)
      </p>

      {loading && (
        <div className="mt-6 max-w-lg">
          <SkeletonForm fields={2} />
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Alert variant="warning" title="No patients in the system">
            Add a patient before creating a case.
          </Alert>
          <Link
            to="/admin/patients/new"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Add a patient
          </Link>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="mt-6">
          <CaseForm
            patients={patients}
            patientLabel={patientOptionLabel}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/cases')}
            apiError={apiError}
          />
        </div>
      )}
    </div>
  );
}
