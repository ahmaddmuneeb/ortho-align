import { useState } from 'react';
import { Ban, CircleDot, Minus, Scissors } from 'lucide-react';
import {
  ODONTOGRAM_ARCH_SPAN,
  ODONTOGRAM_LAYOUT,
  ODONTOGRAM_START_X,
  ODONTOGRAM_TOOTH,
  ODONTOGRAM_VIEWBOX,
} from '../../lib/odontogramLayout';
import type { ToothFieldKey } from '../../lib/toothNotation';

export type OdontogramMode = 'avoidEngagers' | 'extract' | 'leaveSpace' | 'doNotMove';

const MODE_CONFIG: Record<
  OdontogramMode,
  { field: ToothFieldKey; label: string; fill: string; stroke: string; Icon: typeof Ban }
> = {
  avoidEngagers: {
    field: 'avoidEngagersTeeth',
    label: 'Avoid engagers',
    fill: '#ccfbf1',
    stroke: '#0d9488',
    Icon: Ban,
  },
  extract: {
    field: 'extractTeeth',
    label: 'Extract',
    fill: '#fee2e2',
    stroke: '#dc2626',
    Icon: Scissors,
  },
  leaveSpace: {
    field: 'leaveSpacesTeeth',
    label: 'Leave space',
    fill: '#fef3c7',
    stroke: '#d97706',
    Icon: CircleDot,
  },
  doNotMove: {
    field: 'doNotMoveTeeth',
    label: 'Do not move',
    fill: '#e2e8f0',
    stroke: '#475569',
    Icon: Minus,
  },
};

const ALL_MODES = Object.keys(MODE_CONFIG) as OdontogramMode[];

export interface OdontogramTeethState {
  avoidEngagersTeeth: number[];
  extractTeeth: number[];
  leaveSpacesTeeth: number[];
  doNotMoveTeeth: number[];
}

interface OdontogramProps extends OdontogramTeethState {
  readOnly?: boolean;
  onChange: (field: ToothFieldKey, teeth: number[]) => void;
}

function getToothMode(
  n: number,
  state: OdontogramTeethState,
): OdontogramMode | null {
  if (state.avoidEngagersTeeth.includes(n)) return 'avoidEngagers';
  if (state.extractTeeth.includes(n)) return 'extract';
  if (state.leaveSpacesTeeth.includes(n)) return 'leaveSpace';
  if (state.doNotMoveTeeth.includes(n)) return 'doNotMove';
  return null;
}

export function Odontogram({
  avoidEngagersTeeth,
  extractTeeth,
  leaveSpacesTeeth,
  doNotMoveTeeth,
  readOnly,
  onChange,
}: OdontogramProps) {
  const [activeMode, setActiveMode] = useState<OdontogramMode>('avoidEngagers');

  const state: OdontogramTeethState = {
    avoidEngagersTeeth,
    extractTeeth,
    leaveSpacesTeeth,
    doNotMoveTeeth,
  };

  const getList = (field: ToothFieldKey): number[] => {
    switch (field) {
      case 'avoidEngagersTeeth':
        return avoidEngagersTeeth;
      case 'extractTeeth':
        return extractTeeth;
      case 'leaveSpacesTeeth':
        return leaveSpacesTeeth;
      case 'doNotMoveTeeth':
        return doNotMoveTeeth;
    }
  };

  const handleToothClick = (n: number) => {
    if (readOnly) return;
    const { field } = MODE_CONFIG[activeMode];
    const current = getList(field);
    const otherFields = ALL_MODES.map((m) => MODE_CONFIG[m].field).filter((f) => f !== field);

    if (current.includes(n)) {
      onChange(
        field,
        current.filter((t) => t !== n),
      );
      return;
    }

    for (const f of otherFields) {
      const list = getList(f);
      if (list.includes(n)) {
        onChange(
          f,
          list.filter((t) => t !== n),
        );
      }
    }
    onChange(field, [...current, n].sort((a, b) => a - b));
  };

  const { w, h, rx } = ODONTOGRAM_TOOTH;
  const halfW = w / 2;
  const halfH = h / 2;

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Tooth selection mode"
        >
          {ALL_MODES.map((mode) => {
            const { label, Icon, stroke } = MODE_CONFIG[mode];
            const active = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveMode(mode)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                style={active ? { borderColor: stroke } : undefined}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="-mx-2 overflow-x-auto px-2 pb-1 sm:mx-0">
        <svg
          viewBox={`0 0 ${ODONTOGRAM_VIEWBOX.width} ${ODONTOGRAM_VIEWBOX.height}`}
          className="mx-auto min-w-[520px] max-w-full w-full sm:min-w-[640px]"
          role="img"
          aria-label="Adult dentition chart, universal numbering 1 through 32"
        >
          <text x={ODONTOGRAM_VIEWBOX.width / 2} y={24} textAnchor="middle" className="fill-slate-500 text-[11px]">
            Upper (1–16) · Patient view
          </text>
          <text x={ODONTOGRAM_VIEWBOX.width / 2} y={ODONTOGRAM_VIEWBOX.height - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
            Lower (17–32)
          </text>
          <line
            x1={ODONTOGRAM_START_X - 10}
            y1={ODONTOGRAM_VIEWBOX.height / 2}
            x2={ODONTOGRAM_START_X + ODONTOGRAM_ARCH_SPAN + 10}
            y2={ODONTOGRAM_VIEWBOX.height / 2}
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {ODONTOGRAM_LAYOUT.map(({ n, cx, cy }) => {
            const assigned = getToothMode(n, state);
            const cfg = assigned ? MODE_CONFIG[assigned] : null;
            const defaultFill = '#f8fafc';
            const defaultStroke = '#cbd5e1';
            const fill = cfg?.fill ?? defaultFill;
            const stroke = cfg?.stroke ?? defaultStroke;
            const interactive = !readOnly;

            return (
              <g key={n}>
                <rect
                  x={cx - halfW}
                  y={cy - halfH}
                  width={w}
                  height={h}
                  rx={rx}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={assigned ? 2 : 1}
                  className={
                    interactive
                      ? 'cursor-pointer transition-opacity hover:opacity-90'
                      : undefined
                  }
                  onClick={() => handleToothClick(n)}
                  role={interactive ? 'button' : undefined}
                  aria-label={
                    assigned
                      ? `Tooth ${n}, ${MODE_CONFIG[assigned].label}`
                      : `Tooth ${n}`
                  }
                  tabIndex={interactive ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleToothClick(n);
                    }
                  }}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  className="pointer-events-none fill-slate-700 text-[11px] font-medium"
                >
                  {n}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Legend">
        {ALL_MODES.map((mode) => {
          const { label, fill, stroke, Icon } = MODE_CONFIG[mode];
          return (
            <li key={mode} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm border"
                style={{ backgroundColor: fill, borderColor: stroke }}
                aria-hidden
              />
              <Icon className="h-3 w-3 text-slate-500" aria-hidden />
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
