import { AlignCenter, ArrowLeft, ArrowRight } from 'lucide-react';
import { patientInputClass } from '../PatientForm';
import type { MidlinePosition } from '../../types/case';

const MIDLINE: { value: MidlinePosition; label: string }[] = [
  { value: 'CENTERED', label: 'Centered' },
  { value: 'SHIFTED_RIGHT', label: 'Shifted right' },
  { value: 'SHIFTED_LEFT', label: 'Shifted left' },
];

function MidlineDiagram({ position }: { position: MidlinePosition }) {
  const offset =
    position === 'SHIFTED_RIGHT' ? 6 : position === 'SHIFTED_LEFT' ? -6 : 0;
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-12 shrink-0 text-slate-400" aria-hidden>
      <line x1={24} y1={4} x2={24} y2={28} stroke="currentColor" strokeWidth={1} strokeDasharray="2 2" />
      <line
        x1={24 + offset}
        y1={8}
        x2={24 + offset}
        y2={24}
        stroke="#0d9488"
        strokeWidth={2}
      />
    </svg>
  );
}

interface MidlineRowProps {
  arch: 'Upper' | 'Lower';
  position: MidlinePosition;
  shiftMm: number | null | undefined;
  onPosition: (p: MidlinePosition) => void;
  onShift: (mm: number | null) => void;
  readOnly?: boolean;
}

function MidlineRow({
  arch,
  position,
  shiftMm,
  onPosition,
  onShift,
  readOnly,
}: MidlineRowProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-start gap-3">
        <MidlineDiagram position={position} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700">{arch} midline</p>
          {readOnly ? (
            <p className="mt-1 text-sm text-ink">
              {MIDLINE.find((m) => m.value === position)?.label ?? position}
              {position !== 'CENTERED' && shiftMm != null && ` · ${shiftMm} mm`}
            </p>
          ) : (
            <>
              <select
                value={position}
                onChange={(e) => onPosition(e.target.value as MidlinePosition)}
                className={`${patientInputClass} mt-1`}
              >
                {MIDLINE.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {position !== 'CENTERED' && (
                <label className="mt-2 block text-xs text-muted">
                  Shift (mm)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={shiftMm ?? ''}
                    onChange={(e) =>
                      onShift(e.target.value ? Number(e.target.value) : null)
                    }
                    className={patientInputClass}
                  />
                </label>
              )}
            </>
          )}
        </div>
        {!readOnly && position === 'CENTERED' && (
          <AlignCenter className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        )}
        {!readOnly && position === 'SHIFTED_RIGHT' && (
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        )}
        {!readOnly && position === 'SHIFTED_LEFT' && (
          <ArrowLeft className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        )}
      </div>
    </div>
  );
}

export function MidlineVisualSection({
  upperPosition,
  upperShiftMm,
  lowerPosition,
  lowerShiftMm,
  onUpperPosition,
  onUpperShift,
  onLowerPosition,
  onLowerShift,
  readOnly,
}: {
  upperPosition: MidlinePosition;
  upperShiftMm: number | null | undefined;
  lowerPosition: MidlinePosition;
  lowerShiftMm: number | null | undefined;
  onUpperPosition: (p: MidlinePosition) => void;
  onUpperShift: (mm: number | null) => void;
  onLowerPosition: (p: MidlinePosition) => void;
  onLowerShift: (mm: number | null) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MidlineRow
        arch="Upper"
        position={upperPosition}
        shiftMm={upperShiftMm}
        onPosition={onUpperPosition}
        onShift={onUpperShift}
        readOnly={readOnly}
      />
      <MidlineRow
        arch="Lower"
        position={lowerPosition}
        shiftMm={lowerShiftMm}
        onPosition={onLowerPosition}
        onShift={onLowerShift}
        readOnly={readOnly}
      />
    </div>
  );
}
