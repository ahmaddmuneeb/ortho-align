import { useState, type FormEvent } from 'react';
import { patientInputClass } from './PatientForm';
import type { Patient } from '../types/patient';

interface CaseFormProps {
  patients: Patient[];
  onSubmit: (patientId: string, notes: string) => Promise<void>;
  onCancel: () => void;
  apiError?: string | null;
}

export function CaseForm({ patients, onSubmit, onCancel, apiError }: CaseFormProps) {
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setLocalError('Select a patient');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await onSubmit(patientId, notes.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {(apiError || localError) && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {apiError || localError}
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Patient <span className="text-red-500">*</span>
        <select
          required
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className={patientInputClass}
        >
          <option value="">Select patient…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Case notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={patientInputClass}
          placeholder="Optional notes for this case"
        />
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create case'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-brand-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
