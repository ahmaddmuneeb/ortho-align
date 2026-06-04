import { Ban, CircleDot, Minus, Scissors } from 'lucide-react';
import type { ToothFieldKey } from '../../lib/toothNotation';

const CATEGORIES: {
  key: ToothFieldKey;
  label: string;
  color: string;
  Icon: typeof Ban;
}[] = [
  { key: 'avoidEngagersTeeth', label: 'Avoid engagers', color: 'bg-teal-100 text-teal-900', Icon: Ban },
  { key: 'extractTeeth', label: 'Extract', color: 'bg-red-100 text-red-900', Icon: Scissors },
  { key: 'leaveSpacesTeeth', label: 'Leave space', color: 'bg-amber-100 text-amber-900', Icon: CircleDot },
  { key: 'doNotMoveTeeth', label: 'Do not move', color: 'bg-slate-200 text-slate-800', Icon: Minus },
];

interface ToothSummaryChipsProps {
  avoidEngagersTeeth: number[];
  extractTeeth: number[];
  leaveSpacesTeeth: number[];
  doNotMoveTeeth: number[];
  readOnly?: boolean;
  onRemove?: (field: ToothFieldKey, tooth: number) => void;
}

export function ToothSummaryChips({
  avoidEngagersTeeth,
  extractTeeth,
  leaveSpacesTeeth,
  doNotMoveTeeth,
  readOnly,
  onRemove,
}: ToothSummaryChipsProps) {
  const byKey: Record<ToothFieldKey, number[]> = {
    avoidEngagersTeeth,
    extractTeeth,
    leaveSpacesTeeth,
    doNotMoveTeeth,
  };

  const anySelected = CATEGORIES.some((c) => (byKey[c.key]?.length ?? 0) > 0);
  if (!anySelected) {
    return <p className="text-xs text-muted">No tooth-specific selections</p>;
  }

  return (
    <div className="space-y-2">
      {CATEGORIES.map(({ key, label, color, Icon }) => {
        const teeth = byKey[key] ?? [];
        if (teeth.length === 0) return null;
        return (
          <div key={key} className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </span>
            <ul className="flex flex-wrap gap-1" aria-label={`${label} teeth`}>
              {teeth.map((n) => (
                <li key={n}>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
                  >
                    {n}
                    {!readOnly && onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(key, n)}
                        className="rounded-full px-0.5 opacity-70 hover:opacity-100"
                        aria-label={`Remove tooth ${n} from ${label}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
