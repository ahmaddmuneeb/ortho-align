import { Check, HelpCircle, X } from 'lucide-react';
import type { ProcedureOption } from '../../types/case';

const OPTIONS: {
  value: ProcedureOption;
  label: string;
  Icon: typeof Check;
}[] = [
  { value: 'YES', label: 'Yes', Icon: Check },
  { value: 'NO', label: 'No', Icon: X },
  { value: 'ONLY_IF_NEEDED', label: 'If needed', Icon: HelpCircle },
];

interface ProcedureOptionPickerProps {
  label: string;
  value: ProcedureOption;
  onChange: (v: ProcedureOption) => void;
  readOnly?: boolean;
}

export function ProcedureOptionPicker({
  label,
  value,
  onChange,
  readOnly,
}: ProcedureOptionPickerProps) {
  if (readOnly) {
    const o = OPTIONS.find((x) => x.value === value);
    return (
      <div className="text-sm">
        <span className="text-muted">{label}</span>
        <p className="font-medium text-ink">{o?.label ?? value.replace(/_/g, ' ')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="mt-1.5 flex gap-1">
        {OPTIONS.map(({ value: v, label: lbl, Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}
