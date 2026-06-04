import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import {
  PatientForm,
  patientToFormValues,
} from '../../components/PatientForm';
import { Alert, Button } from '../../components/ui';
import { SkeletonCaseDetail } from '../../components/ui/Skeleton';
import { api, ApiError } from '../../lib/api';
import { formatApiError } from '../../lib/formErrors';
import { formatDisplayDate } from '../../lib/patientDates';
import { toast } from '../../lib/toast';
import type { Gender } from '../../types/auth';
import type {
  Patient,
  PatientDeleteResponse,
  PatientResponse,
  PatientUpdatePayload,
} from '../../types/patient';

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export function AdminPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      toast.success('Patient updated');
    } catch (err) {
      setApiError(formatApiError(err, 'Failed to update patient'));
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!id || !patient) return;
    setDeleting(true);
    try {
      const data = await api.delete<PatientDeleteResponse>(`/api/patients/${id}`);
      const extra =
        data.deletedCaseCount > 0
          ? ` (${data.deletedCaseCount} case${data.deletedCaseCount === 1 ? '' : 's'} removed)`
          : '';
      toast.success(`Patient deleted${extra}`);
      navigate('/admin/patients');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <SkeletonCaseDetail sections={2} />;
  }

  if (loadError) {
    return (
      <div>
        <Alert variant="error">{loadError}</Alert>
        <Link
          to="/admin/patients"
          className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Back to patients
        </Link>
      </div>
    );
  }

  if (!patient) return null;

  const client = patient.createdBy;

  return (
    <div>
      <Link to="/admin/patients" className="text-sm font-medium text-brand-700 hover:underline">
        ← Patients
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{patient.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted">{patient.id}</p>
          {client && (
            <p className="mt-2 text-sm text-muted">
              Client:{' '}
              <Link
                to={`/admin/users/${client.id}`}
                className="font-medium text-brand-700 hover:underline"
              >
                {client.name}
              </Link>{' '}
              ({client.email})
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setApiError(null);
                setEditing(true);
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700"
            >
              <Pencil className="h-4 w-4" />
              Edit patient
            </button>
          )}
          {!showDeleteConfirm && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete patient
            </Button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <Alert variant="warning" title={`Delete "${patient.name}"?`} className="mt-4">
          <p>
            This action cannot be undone.
            {(patient.cases?.length ?? 0) > 0 && (
              <>
                {' '}
                This will permanently delete {patient.cases!.length} linked case
                {patient.cases!.length === 1 ? '' : 's'} and all related data.
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              loadingText="Deleting…"
              onClick={handleDelete}
            >
              Confirm delete
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={deleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      )}

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
            <dd className="mt-1 text-sm text-ink">{formatDisplayDate(patient.createdAt)}</dd>
          </div>
        </dl>
      )}

      {patient.cases && patient.cases.length > 0 && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-ink">Cases</h2>
          <p className="mt-1 text-sm text-muted">Orthodontic cases for this patient</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {patient.cases.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <Link
                  to={`/admin/cases/${c.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  View case
                </Link>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                  {c.status}
                </span>
                <span className="text-muted">{formatDisplayDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
