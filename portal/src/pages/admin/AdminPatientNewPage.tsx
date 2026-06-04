import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PatientForm, patientInputClass } from '../../components/PatientForm';
import { Alert } from '../../components/ui';
import { SkeletonForm } from '../../components/ui/Skeleton';
import { api, ApiError } from '../../lib/api';
import { formatApiError } from '../../lib/formErrors';
import { toast } from '../../lib/toast';
import type { AdminUser } from '../../types/case';
import type { PatientCreatePayload, PatientResponse } from '../../types/patient';

const emptyValues = {
  name: '',
  gender: '' as const,
  dateOfBirth: '',
  address: '',
  notes: '',
};

export function AdminPatientNewPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [createdById, setCreatedById] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ users: AdminUser[] }>('/api/users?role=CLIENT');
        if (!cancelled) {
          const list = data.users ?? [];
          setClients(list);
          if (list.length === 1) setCreatedById(list[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Failed to load clients');
        }
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (payload: PatientCreatePayload) => {
    setClientError(null);
    setApiError(null);
    if (!createdById) {
      setClientError('Select a client (practice owner) for this patient');
      throw new Error('missing client');
    }
    try {
      const data = await api.post<PatientResponse>('/api/patients', {
        ...payload,
        createdById,
      });
      toast.success('Patient created');
      navigate(`/admin/patients/${data.patient.id}`, { replace: true });
    } catch (err) {
      setApiError(formatApiError(err, 'Failed to create patient'));
      throw err;
    }
  };

  return (
    <div>
      <Link to="/admin/patients" className="text-sm font-medium text-brand-700 hover:underline">
        ← Patients
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-ink">Add patient</h1>
      <p className="mt-1 text-sm text-muted">Create a patient record for a client practice</p>

      {loadingClients && (
        <div className="mt-6 max-w-lg">
          <SkeletonForm fields={3} />
        </div>
      )}
      {loadError && (
        <div className="mt-6">
          <Alert variant="error">{loadError}</Alert>
        </div>
      )}

      {!loadingClients && !loadError && clients.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Alert variant="warning" title="No client accounts yet">
            Clients register at /register or you can invite them via user management.
          </Alert>
        </div>
      )}

      {!loadingClients && !loadError && clients.length > 0 && (
        <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Client (practice owner) <span className="text-red-600">*</span>
            <select
              value={createdById}
              onChange={(e) => {
                setCreatedById(e.target.value);
                if (clientError) setClientError(null);
              }}
              className={patientInputClass}
              required
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </label>
          {clientError && (
            <div className="mt-2">
              <Alert variant="error">{clientError}</Alert>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <PatientForm
              initialValues={emptyValues}
              submitLabel="Create patient"
              submittingLabel="Creating…"
              onSubmit={handleSubmit}
              onCancel={() => navigate('/admin/patients')}
              apiError={apiError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
