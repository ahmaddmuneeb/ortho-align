import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { MAX, sanitizeText } from '../../lib/sanitize';
import { patientInputClass } from '../PatientForm';
import { Alert, Button } from '../ui';
import type { CaseRecord, ClarificationCategory } from '../../types/case';

const CATEGORY_OPTIONS: { value: ClarificationCategory; label: string }[] = [
  { value: 'WRONG_FILES', label: 'Wrong files uploaded' },
  { value: 'MISSING_SCANS', label: 'Missing upper or lower scans' },
  { value: 'DISTORTED_SCAN_DATA', label: 'Distorted scan data' },
  { value: 'MISMATCHED_PATIENT_DATA', label: 'Mismatched patient data' },
  { value: 'MISSING_RECORDS', label: 'Missing records' },
  { value: 'POOR_SCAN_QUALITY', label: 'Poor scan quality' },
  { value: 'OTHER_TECHNICAL_ISSUE', label: 'Other technical issue' },
];

interface ClarificationRequestFormProps {
  caseId: string;
  onSubmitted: (caseRecord: CaseRecord) => void;
  onCancel: () => void;
}

export function ClarificationRequestForm({
  caseId,
  onSubmitted,
  onCancel,
}: ClarificationRequestFormProps) {
  const [category, setCategory] = useState<ClarificationCategory>('WRONG_FILES');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = sanitizeText(message, { maxLength: MAX.notes, multiline: true });
    if (!cleanMessage) {
      setError('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('message', cleanMessage);
      files.forEach((f) => formData.append('files', f));
      const data = await api.upload<{ case: CaseRecord }>(
        `/api/cases/${caseId}/clarifications`,
        formData,
      );
      onSubmitted(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send clarification request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4"
    >
      {error && <Alert variant="error">{error}</Alert>}
      <label className="block text-sm font-medium text-slate-700">
        Issue category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ClarificationCategory)}
          className={patientInputClass}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Describe the problem
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          className={patientInputClass}
          placeholder="Explain what's wrong so the doctor can fix it…"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Attach screenshots/files (optional)
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files).slice(0, 5) : [])}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="secondary"
          loading={submitting}
          loadingText="Sending…"
          className="!bg-amber-600 !text-white hover:!bg-amber-700"
        >
          Send to doctor for clarification
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
