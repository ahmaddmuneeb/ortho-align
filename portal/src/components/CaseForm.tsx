import { useState, type FormEvent } from 'react';
import { MAX, sanitizeText } from '../lib/sanitize';
import { patientInputClass } from './PatientForm';
import { Alert, Button } from './ui';
import type { Patient } from '../types/patient';

interface CaseFormProps {
  patients: Patient[];
  onSubmit: (patientId: string, notes: string) => Promise<void>;
  onCancel: () => void;
  apiError?: string | null;
  /** Override option text (e.g. show client name for admin) */
  patientLabel?: (patient: Patient) => string;
}

export function CaseForm({
  patients,
  onSubmit,
  onCancel,
  apiError,
  patientLabel,
}: CaseFormProps) {
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
      await onSubmit(
        patientId,
        sanitizeText(notes, { maxLength: MAX.notes, multiline: true }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {(apiError || localError) && (
        <div className="mb-4">
          <Alert variant="error">{apiError || localError}</Alert>
        </div>
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
              {patientLabel ? patientLabel(p) : p.name}
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
        <Button type="submit" loading={submitting} loadingText="Creating…">
          Create case
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
