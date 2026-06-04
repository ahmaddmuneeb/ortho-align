import { useState, type FormEvent } from 'react';
import type { Gender, PatientCreatePayload } from '../types/patient';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const patientInputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export interface PatientFormValues {
  name: string;
  gender: Gender | '';
  dateOfBirth: string;
  address: string;
  notes: string;
}

export function patientToFormValues(patient: {
  name: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
}): PatientFormValues {
  return {
    name: patient.name,
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().slice(0, 10)
      : '',
    address: patient.address ?? '',
    notes: patient.notes ?? '',
  };
}

export function formValuesToPayload(values: PatientFormValues): PatientCreatePayload {
  return {
    name: values.name.trim(),
    gender: values.gender || null,
    dateOfBirth: values.dateOfBirth || null,
    address: values.address.trim() || null,
    notes: values.notes.trim() || null,
  };
}

interface PatientFormProps {
  initialValues: PatientFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: PatientCreatePayload) => Promise<void>;
  onCancel?: () => void;
  apiError?: string | null;
}

export function PatientForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  apiError,
}: PatientFormProps) {
  const [values, setValues] = useState(initialValues);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    if (!values.name.trim()) {
      setFieldError('Patient name is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formValuesToPayload(values));
    } finally {
      setSubmitting(false);
    }
  };

  const set =
    (key: keyof PatientFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
      if (fieldError) setFieldError(null);
    };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {(apiError || fieldError) && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {fieldError ?? apiError}
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Full name <span className="text-red-600">*</span>
        <input
          name="name"
          required
          value={values.name}
          onChange={set('name')}
          className={patientInputClass}
          aria-invalid={!!fieldError && !values.name.trim()}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Gender
        <select
          name="gender"
          value={values.gender}
          onChange={set('gender')}
          className={patientInputClass}
        >
          <option value="">Not specified</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Date of birth
        <input
          name="dateOfBirth"
          type="date"
          value={values.dateOfBirth}
          onChange={set('dateOfBirth')}
          className={patientInputClass}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Address
        <input
          name="address"
          value={values.address}
          onChange={set('address')}
          className={patientInputClass}
          autoComplete="street-address"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="notes"
          rows={3}
          value={values.notes}
          onChange={set('notes')}
          className={patientInputClass}
        />
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-brand-500 hover:text-brand-700 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
