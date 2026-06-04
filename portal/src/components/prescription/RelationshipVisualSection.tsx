import { patientInputClass } from '../PatientForm';

const HINTS = ['Class I', 'Class II', 'Class III', 'End-on'];

interface RelationshipVisualSectionProps {
  canineRelationshipRight: string;
  canineRelationshipLeft: string;
  molarRelationshipRight: string;
  molarRelationshipLeft: string;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}

function RelationshipField({
  label,
  value,
  hintSide,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  hintSide: 'left' | 'right';
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 40 28" className="h-7 w-10 shrink-0" aria-hidden>
          <path
            d={
              hintSide === 'right'
                ? 'M8 20 Q20 8 32 20'
                : 'M8 20 Q20 8 32 20'
            }
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
          <circle cx={hintSide === 'right' ? 30 : 10} cy={18} r={3} fill="#99f6e4" stroke="#0d9488" />
          <circle cx={hintSide === 'right' ? 22 : 18} cy={14} r={2.5} fill="#e2e8f0" stroke="#64748b" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-600">{label}</p>
          {readOnly ? (
            <p className="mt-1 text-sm text-ink">{value || '—'}</p>
          ) : (
            <>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. Class I"
                className={patientInputClass}
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {HINTS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(h)}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RelationshipVisualSection({
  canineRelationshipRight,
  canineRelationshipLeft,
  molarRelationshipRight,
  molarRelationshipLeft,
  onChange,
  readOnly,
}: RelationshipVisualSectionProps) {
  const fields = [
    ['canineRelationshipRight', 'Canine (right)', canineRelationshipRight, 'right'],
    ['canineRelationshipLeft', 'Canine (left)', canineRelationshipLeft, 'left'],
    ['molarRelationshipRight', 'Molar (right)', molarRelationshipRight, 'right'],
    ['molarRelationshipLeft', 'Molar (left)', molarRelationshipLeft, 'left'],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(([key, label, val, side]) => (
        <RelationshipField
          key={key}
          label={label}
          value={val ?? ''}
          hintSide={side}
          onChange={(v) => onChange(key, v)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
