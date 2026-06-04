import { Minus, Sparkles, TrendingUp } from 'lucide-react';
import type { AlignmentGoal } from '../../types/case';

const GOALS: {
  value: AlignmentGoal;
  label: string;
  short: string;
  Icon: typeof Minus;
}[] = [
  { value: 'MAINTAIN', label: 'Maintain', short: 'Keep as-is', Icon: Minus },
  { value: 'IMPROVE', label: 'Improve', short: 'Moderate change', Icon: TrendingUp },
  { value: 'IDEALIZE', label: 'Idealize', short: 'Ideal alignment', Icon: Sparkles },
];

interface AlignmentGoalPickerProps {
  label: string;
  value: AlignmentGoal;
  onChange: (v: AlignmentGoal) => void;
  readOnly?: boolean;
}

export function AlignmentGoalPicker({
  label,
  value,
  onChange,
  readOnly,
}: AlignmentGoalPickerProps) {
  if (readOnly) {
    const g = GOALS.find((x) => x.value === value);
    return (
      <div className="text-sm">
        <span className="text-muted">{label}</span>
        <p className="font-medium text-ink">{g?.label ?? value}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {GOALS.map(({ value: v, label: lbl, short, Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="text-[11px] font-semibold leading-tight">{lbl}</span>
              <span className="text-[9px] text-muted leading-tight">{short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AlignmentGoalPickerGrid<K extends string>({
  fields,
  values,
  onChange,
  readOnly,
}: {
  fields: readonly { key: K; label: string }[];
  values: Record<K, AlignmentGoal>;
  onChange: (key: K, v: AlignmentGoal) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ key, label }) => (
        <AlignmentGoalPicker
          key={key}
          label={label}
          value={values[key] as AlignmentGoal}
          onChange={(v) => onChange(key, v)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
