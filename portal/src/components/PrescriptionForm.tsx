import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  Clock,
  FileText,
  Layers,
  MessageSquare,
  Settings2,
} from 'lucide-react';
import { patientInputClass } from './PatientForm';
import { Alert, Button } from './ui';
import { parseTeethArray, validateTeethList, type ToothFieldKey } from '../lib/toothNotation';
import { MAX, sanitizeText } from '../lib/sanitize';
import { toast } from '../lib/toast';
import { Odontogram } from './prescription/Odontogram';
import { ToothSummaryChips } from './prescription/ToothSummaryChips';
import { AlignmentGoalPickerGrid } from './prescription/AlignmentGoalPicker';
import { ProcedureOptionPicker } from './prescription/ProcedureOptionPicker';
import { MidlineVisualSection } from './prescription/MidlineVisualSection';
import { RelationshipVisualSection } from './prescription/RelationshipVisualSection';
import { ClinicalPhotosCallout } from './prescription/ClinicalPhotosCallout';
import type { Prescription, PrescriptionInput, ProcedureOption } from '../types/case';

type AlignmentGoalKey =
  | 'upperMidlineGoal'
  | 'lowerMidlineGoal'
  | 'overjetGoal'
  | 'overbiteGoal'
  | 'archFormGoal'
  | 'canineRelationshipGoal'
  | 'molarRelationshipGoal'
  | 'posteriorRelationshipGoal';

export function prescriptionToForm(p?: Prescription | null): PrescriptionInput {
  return {
    durationRecommended: p?.durationRecommended ?? true,
    durationLimitSteps: p?.durationLimitSteps ?? null,
    chiefComplaint: p?.chiefComplaint ?? '',
    upperMidlinePosition: p?.upperMidlinePosition ?? 'CENTERED',
    upperMidlineShiftMm: p?.upperMidlineShiftMm ?? null,
    lowerMidlinePosition: p?.lowerMidlinePosition ?? 'CENTERED',
    lowerMidlineShiftMm: p?.lowerMidlineShiftMm ?? null,
    canineRelationshipRight: p?.canineRelationshipRight ?? '',
    canineRelationshipLeft: p?.canineRelationshipLeft ?? '',
    molarRelationshipRight: p?.molarRelationshipRight ?? '',
    molarRelationshipLeft: p?.molarRelationshipLeft ?? '',
    treatUpperArch: p?.treatUpperArch ?? true,
    treatLowerArch: p?.treatLowerArch ?? true,
    upperMidlineGoal: p?.upperMidlineGoal ?? 'IMPROVE',
    lowerMidlineGoal: p?.lowerMidlineGoal ?? 'IMPROVE',
    overjetGoal: p?.overjetGoal ?? 'IMPROVE',
    overbiteGoal: p?.overbiteGoal ?? 'IMPROVE',
    archFormGoal: p?.archFormGoal ?? 'IMPROVE',
    canineRelationshipGoal: p?.canineRelationshipGoal ?? 'IMPROVE',
    molarRelationshipGoal: p?.molarRelationshipGoal ?? 'MAINTAIN',
    posteriorRelationshipGoal: p?.posteriorRelationshipGoal ?? 'MAINTAIN',
    iprOption: p?.iprOption ?? 'ONLY_IF_NEEDED',
    engagersOption: p?.engagersOption ?? 'ONLY_IF_NEEDED',
    proclineOption: p?.proclineOption ?? 'ONLY_IF_NEEDED',
    expandOption: p?.expandOption ?? 'ONLY_IF_NEEDED',
    distalizeOption: p?.distalizeOption ?? 'ONLY_IF_NEEDED',
    avoidEngagersTeeth: parseTeethArray(p?.avoidEngagersTeeth),
    extractTeeth: parseTeethArray(p?.extractTeeth),
    leaveSpacesTeeth: parseTeethArray(p?.leaveSpacesTeeth),
    doNotMoveTeeth: parseTeethArray(p?.doNotMoveTeeth),
    includeRetainer: p?.includeRetainer ?? true,
    additionalInstructions: p?.additionalInstructions ?? '',
  };
}

const ALIGNMENT_FIELDS = [
  { key: 'upperMidlineGoal', label: 'Upper midline' },
  { key: 'lowerMidlineGoal', label: 'Lower midline' },
  { key: 'overjetGoal', label: 'Overjet' },
  { key: 'overbiteGoal', label: 'Overbite' },
  { key: 'archFormGoal', label: 'Arch form' },
  { key: 'canineRelationshipGoal', label: 'Canine' },
  { key: 'molarRelationshipGoal', label: 'Molar' },
  { key: 'posteriorRelationshipGoal', label: 'Posterior' },
] as const satisfies readonly { key: AlignmentGoalKey; label: string }[];

const PROCEDURE_FIELDS: { key: keyof PrescriptionInput; label: string }[] = [
  { key: 'iprOption', label: 'IPR' },
  { key: 'engagersOption', label: 'Engagers' },
  { key: 'proclineOption', label: 'Procline' },
  { key: 'expandOption', label: 'Expand' },
  { key: 'distalizeOption', label: 'Distalize' },
];

const cardClass = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionTitleClass = 'flex items-center gap-2 text-sm font-semibold text-ink';

interface PrescriptionFormProps {
  initial?: Prescription | null;
  onSubmit: (data: PrescriptionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  readOnly?: boolean;
}

export function PrescriptionForm({
  initial,
  onSubmit,
  onDelete,
  readOnly,
}: PrescriptionFormProps) {
  const [values, setValues] = useState<PrescriptionInput>(() => prescriptionToForm(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(prescriptionToForm(initial));
  }, [initial?.id, initial?.updatedAt]);

  const set = <K extends keyof PrescriptionInput>(key: K, val: PrescriptionInput[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const setTeethField = (field: ToothFieldKey, teeth: number[]) => {
    set(field, teeth);
  };

  const removeTooth = (field: ToothFieldKey, tooth: number) => {
    const list = values[field] ?? [];
    set(field, list.filter((t) => t !== tooth));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setError(null);

    const toothErrors = [
      validateTeethList(values.avoidEngagersTeeth, 'Avoid engagers teeth'),
      validateTeethList(values.extractTeeth, 'Extract teeth'),
      validateTeethList(values.leaveSpacesTeeth, 'Leave spaces teeth'),
      validateTeethList(values.doNotMoveTeeth, 'Do not move teeth'),
    ].filter(Boolean) as string[];
    if (toothErrors.length > 0) {
      setError(toothErrors.join(' '));
      toast.error(toothErrors[0]);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        chiefComplaint: sanitizeText(values.chiefComplaint, {
          maxLength: MAX.chiefComplaint,
          multiline: true,
        }),
        canineRelationshipRight:
          sanitizeText(values.canineRelationshipRight, {
            maxLength: MAX.relationship,
          }) || null,
        canineRelationshipLeft:
          sanitizeText(values.canineRelationshipLeft, {
            maxLength: MAX.relationship,
          }) || null,
        molarRelationshipRight:
          sanitizeText(values.molarRelationshipRight, {
            maxLength: MAX.relationship,
          }) || null,
        molarRelationshipLeft:
          sanitizeText(values.molarRelationshipLeft, {
            maxLength: MAX.relationship,
          }) || null,
        avoidEngagersTeeth: values.avoidEngagersTeeth ?? [],
        extractTeeth: values.extractTeeth ?? [],
        leaveSpacesTeeth: values.leaveSpacesTeeth ?? [],
        doNotMoveTeeth: values.doNotMoveTeeth ?? [],
        additionalInstructions:
          sanitizeText(values.additionalInstructions, {
            maxLength: MAX.instructions,
            multiline: true,
          }) || null,
      });
      toast.success('Prescription saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save prescription';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pictorial = !readOnly;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <MessageSquare className="h-4 w-4 text-brand-600" aria-hidden />
          Chief complaint {!readOnly && <span className="text-red-500">*</span>}
        </h3>
        {readOnly ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {values.chiefComplaint || '—'}
          </p>
        ) : (
          <textarea
            required
            minLength={10}
            value={values.chiefComplaint}
            onChange={(e) => set('chiefComplaint', e.target.value)}
            rows={3}
            className={`${patientInputClass} mt-3`}
            placeholder="Describe the patient's main concern (at least 10 characters)"
          />
        )}
      </div>

      {pictorial && <ClinicalPhotosCallout />}

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Layers className="h-4 w-4 text-brand-600" aria-hidden />
          Arches & duration
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['treatUpperArch', 'Treat upper arch'],
              ['treatLowerArch', 'Treat lower arch'],
              ['durationRecommended', 'Recommended duration'],
              ['includeRetainer', 'Include retainer'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                values[key]
                  ? 'border-brand-200 bg-brand-50 text-brand-900'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <input
                type="checkbox"
                disabled={readOnly}
                checked={Boolean(values[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
        {!values.durationRecommended && (
          <label className="mt-3 block text-sm font-medium text-slate-700">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted" aria-hidden />
              Duration limit (steps)
            </span>
            <input
              type="number"
              min={1}
              disabled={readOnly}
              value={values.durationLimitSteps ?? ''}
              onChange={(e) =>
                set('durationLimitSteps', e.target.value ? Number(e.target.value) : null)
              }
              className={patientInputClass}
            />
          </label>
        )}
      </div>

      <div className={`${cardClass} border-teal-100 bg-gradient-to-b from-teal-50/50 to-white`}>
        <h3 className={sectionTitleClass}>
          <Activity className="h-4 w-4 text-brand-600" aria-hidden />
          Alignment goals
        </h3>
        <div className="mt-4">
          <AlignmentGoalPickerGrid
            fields={ALIGNMENT_FIELDS}
            values={{
              upperMidlineGoal: values.upperMidlineGoal ?? 'IMPROVE',
              lowerMidlineGoal: values.lowerMidlineGoal ?? 'IMPROVE',
              overjetGoal: values.overjetGoal ?? 'IMPROVE',
              overbiteGoal: values.overbiteGoal ?? 'IMPROVE',
              archFormGoal: values.archFormGoal ?? 'IMPROVE',
              canineRelationshipGoal: values.canineRelationshipGoal ?? 'IMPROVE',
              molarRelationshipGoal: values.molarRelationshipGoal ?? 'MAINTAIN',
              posteriorRelationshipGoal: values.posteriorRelationshipGoal ?? 'MAINTAIN',
            }}
            onChange={(key, v) => set(key, v)}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Settings2 className="h-4 w-4 text-brand-600" aria-hidden />
          Procedures
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PROCEDURE_FIELDS.map(({ key, label }) => (
            <ProcedureOptionPicker
              key={key}
              label={label}
              value={values[key] as ProcedureOption}
              onChange={(v) => set(key, v)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>Existing relationships</h3>
        <p className="mt-1 text-xs text-muted">
          Current canine and molar relationships (optional).
        </p>
        <div className="mt-3">
          <RelationshipVisualSection
            canineRelationshipRight={values.canineRelationshipRight ?? ''}
            canineRelationshipLeft={values.canineRelationshipLeft ?? ''}
            molarRelationshipRight={values.molarRelationshipRight ?? ''}
            molarRelationshipLeft={values.molarRelationshipLeft ?? ''}
            onChange={(key, v) => set(key as keyof PrescriptionInput, v)}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>Midline position</h3>
        <div className="mt-3">
          <MidlineVisualSection
            upperPosition={values.upperMidlinePosition ?? 'CENTERED'}
            upperShiftMm={values.upperMidlineShiftMm}
            lowerPosition={values.lowerMidlinePosition ?? 'CENTERED'}
            lowerShiftMm={values.lowerMidlineShiftMm}
            onUpperPosition={(p) => set('upperMidlinePosition', p)}
            onUpperShift={(mm) => set('upperMidlineShiftMm', mm)}
            onLowerPosition={(p) => set('lowerMidlinePosition', p)}
            onLowerShift={(mm) => set('lowerMidlineShiftMm', mm)}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-teal-900">Tooth-specific instructions</h3>
        <p className="mt-1 text-xs text-teal-800/90">
          Universal numbering <strong>1–32</strong>
          {pictorial
            ? ' — select a category, then tap teeth on the chart.'
            : ' — summary of marked teeth.'}
        </p>
        <div className="mt-4">
          <Odontogram
            avoidEngagersTeeth={values.avoidEngagersTeeth ?? []}
            extractTeeth={values.extractTeeth ?? []}
            leaveSpacesTeeth={values.leaveSpacesTeeth ?? []}
            doNotMoveTeeth={values.doNotMoveTeeth ?? []}
            readOnly={readOnly}
            onChange={setTeethField}
          />
        </div>
        <div className="mt-4 border-t border-teal-100 pt-4">
          <ToothSummaryChips
            avoidEngagersTeeth={values.avoidEngagersTeeth ?? []}
            extractTeeth={values.extractTeeth ?? []}
            leaveSpacesTeeth={values.leaveSpacesTeeth ?? []}
            doNotMoveTeeth={values.doNotMoveTeeth ?? []}
            readOnly={readOnly}
            onRemove={readOnly ? undefined : removeTooth}
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <FileText className="h-4 w-4 text-brand-600" aria-hidden />
          Additional instructions
        </h3>
        {readOnly ? (
          <p className="mt-2 text-sm text-slate-700">
            {values.additionalInstructions || '—'}
          </p>
        ) : (
          <textarea
            value={values.additionalInstructions ?? ''}
            onChange={(e) => set('additionalInstructions', e.target.value)}
            rows={2}
            className={`${patientInputClass} mt-3`}
            placeholder="Optional notes for the design team"
          />
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={submitting} loadingText="Saving…">
            Save prescription
          </Button>
          {onDelete && initial && (
            <Button type="button" variant="danger" onClick={() => onDelete()}>
              Remove prescription
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
