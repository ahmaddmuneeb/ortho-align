import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PatientForm,
  patientToFormValues,
} from '../components/PatientForm';
import { api, ApiError } from '../lib/api';
import { formatApiError } from '../lib/formErrors';
import { formatDisplayDate } from '../lib/patientDates';
import type { Gender } from '../types/auth';
import type { Patient, PatientResponse, PatientUpdatePayload } from '../types/patient';

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadPatient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.get<PatientResponse>(`/api/patients/${id}`);
      setPatient(data.patient);
    } catch (err) {
      setLoadError(
        err instanceof ApiError && err.status === 404
          ? 'Patient not found'
          : formatApiError(err, 'Failed to load patient'),
      );
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleUpdate = async (payload: PatientUpdatePayload) => {
    if (!id) return;
    setApiError(null);
    try {
      const data = await api.patch<PatientResponse>(`/api/patients/${id}`, payload);
      setPatient(data.patient);
      setEditing(false);
    } catch (err) {
      setApiError(formatApiError(err, 'Failed to update patient'));
      throw err;
    }
  };

  if (loading) {
    return <p className="text-muted">Loading patient…</p>;
  }

  if (loadError) {
    return (
      <div>
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
        <Link
          to="/patients"
          className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Back to patients
        </Link>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div>
      <nav className="text-sm text-muted">
        <Link to="/patients" className="text-brand-700 hover:underline">
          Patients
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{patient.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{patient.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted">{patient.id}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setApiError(null);
              setEditing(true);
            }}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700"
          >
            Edit patient
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-ink">Edit patient</h2>
          <div className="mt-4">
            <PatientForm
              key={`${patient.id}-${patient.name}-${patient.dateOfBirth}`}
              initialValues={patientToFormValues(patient)}
              submitLabel="Save changes"
              submittingLabel="Saving…"
              onSubmit={handleUpdate}
              onCancel={() => {
                setApiError(null);
                setEditing(false);
              }}
              apiError={apiError}
            />
          </div>
        </div>
      ) : (
        <dl className="mt-6 grid max-w-lg gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Gender</dt>
            <dd className="mt-1 text-sm text-ink">
              {patient.gender ? GENDER_LABELS[patient.gender] : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Date of birth</dt>
            <dd className="mt-1 text-sm text-ink">{formatDisplayDate(patient.dateOfBirth)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-muted">Address</dt>
            <dd className="mt-1 text-sm text-ink">{patient.address || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-muted">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {patient.notes || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Created</dt>
            <dd className="mt-1 text-sm text-ink">
              {formatDisplayDate(patient.createdAt)}
            </dd>
          </div>
        </dl>
      )}

      {patient.cases && patient.cases.length > 0 && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-ink">Cases</h2>
          <p className="mt-1 text-sm text-muted">
            Orthodontic cases linked to this patient (case workflow in a later release)
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {patient.cases.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                  {c.status}
                </span>
                <span className="text-muted">{formatDisplayDate(c.createdAt)}</span>
                <span className="font-mono text-xs text-muted">{c.id}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
