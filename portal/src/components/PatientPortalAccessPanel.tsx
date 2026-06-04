import { useState, type FormEvent } from 'react';
import { patientInputClass } from './PatientForm';
import { api, ApiError } from '../lib/api';
import { toast } from '../lib/toast';
import type { CreatePatientAccountResponse } from '../types/patientPortal';

interface PatientPortalAccessPanelProps {
  patientId: string;
  patientName: string;
}

export function PatientPortalAccessPanel({
  patientId,
  patientName,
}: PatientPortalAccessPanelProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(patientName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatePatientAccountResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.post<CreatePatientAccountResponse>(
        '/api/users/patient-accounts',
        { patientId, email, password, name: name.trim() },
      );
      setCreated(data);
      setOpen(false);
      toast.success('Patient portal account created');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create account';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
        <h2 className="text-lg font-semibold text-ink">Patient portal access</h2>
        <p className="mt-2 text-sm text-slate-700">
          Account created for <strong>{created.user.email}</strong>. Share the temporary
          password with the patient.
        </p>
        <p className="mt-2 font-mono text-xs text-muted">Password: {created.temporaryPassword}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Patient portal access</h2>
          <p className="mt-1 text-sm text-muted">
            Create login credentials so this patient can view their cases (read-only).
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create portal access
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Display name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={patientInputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={patientInputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Temporary password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={patientInputClass}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create account'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
