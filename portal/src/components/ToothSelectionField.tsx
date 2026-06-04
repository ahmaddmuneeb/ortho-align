import { useState } from 'react';
import { patientInputClass } from './PatientForm';
import { mergeTeeth, parseTeethInput } from '../lib/toothNotation';

interface ToothSelectionFieldProps {
  id: string;
  label: string;
  description?: string;
  teeth: number[];
  onChange: (teeth: number[]) => void;
  readOnly?: boolean;
}

export function ToothSelectionField({
  id,
  label,
  description,
  teeth,
  onChange,
  readOnly,
}: ToothSelectionFieldProps) {
  const [draft, setDraft] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const addFromDraft = () => {
    const { teeth: parsed, invalid } = parseTeethInput(draft);
    if (invalid.length > 0) {
      setInputError(`Invalid: ${invalid.join(', ')}. Use teeth ${1}–${32}.`);
      return;
    }
    if (parsed.length === 0) {
      setInputError('Enter one or more tooth numbers (e.g. 8, 9, 24).');
      return;
    }
    onChange(mergeTeeth(teeth, parsed));
    setDraft('');
    setInputError(null);
  };

  const removeTooth = (n: number) => {
    onChange(teeth.filter((t) => t !== n));
  };

  return (
    <div className="rounded-lg border border-teal-100 bg-white/90 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-teal-900">
            {label}
          </label>
          {description && <p className="mt-0.5 text-xs text-teal-800/80">{description}</p>}
        </div>
        {!readOnly && teeth.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-teal-700 hover:text-teal-900"
          >
            Clear all
          </button>
        )}
      </div>

      {teeth.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${label} selected teeth`}>
          {teeth.map((n) => (
            <li key={n}>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-sm font-medium text-teal-900">
                {n}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeTooth(n)}
                    className="rounded-full px-0.5 text-teal-600 hover:bg-teal-200 hover:text-teal-900"
                    aria-label={`Remove tooth ${n}`}
                  >
                    ×
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder="e.g. 8, 9, 24, 25"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFromDraft();
              }
            }}
            className={patientInputClass}
            aria-describedby={`${id}-help`}
          />
          <button
            type="button"
            onClick={addFromDraft}
            className="shrink-0 rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
          >
            Add teeth
          </button>
        </div>
      )}

      {readOnly && teeth.length === 0 && (
        <p className="mt-2 text-xs text-muted">None selected</p>
      )}

      {inputError && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {inputError}
        </p>
      )}
    </div>
  );
}
