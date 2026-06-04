import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PatientForm } from '../components/PatientForm';
import { api } from '../lib/api';
import { formatApiError } from '../lib/formErrors';
import type { PatientCreatePayload, PatientResponse } from '../types/patient';

const emptyValues = {
  name: '',
  gender: '' as const,
  dateOfBirth: '',
  address: '',
  notes: '',
};

export function PatientNewPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (payload: PatientCreatePayload) => {
    setApiError(null);
    try {
      const data = await api.post<PatientResponse>('/api/patients', payload);
      navigate(`/patients/${data.patient.id}`, { replace: true });
    } catch (err) {
      setApiError(formatApiError(err, 'Failed to create patient'));
      throw err;
    }
  };

  return (
    <div>
      <nav className="text-sm text-muted">
        <Link to="/patients" className="text-brand-700 hover:underline">
          Patients
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">New patient</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-ink">Add patient</h1>
      <p className="mt-1 text-sm text-muted">Create a new patient record for your practice</p>

      <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PatientForm
          initialValues={emptyValues}
          submitLabel="Create patient"
          submittingLabel="Creating…"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/patients')}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
