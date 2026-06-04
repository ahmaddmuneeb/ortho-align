import { useEffect, useState, type FormEvent } from 'react';
import { patientInputClass } from './PatientForm';
import { ToothSelectionField } from './ToothSelectionField';
import { parseTeethArray, validateTeethList } from '../lib/toothNotation';
import { toast } from '../lib/toast';
import type {
  AlignmentGoal,
  MidlinePosition,
  Prescription,
  PrescriptionInput,
  ProcedureOption,
} from '../types/case';

const GOALS: AlignmentGoal[] = ['MAINTAIN', 'IMPROVE', 'IDEALIZE'];
const PROCEDURES: ProcedureOption[] = ['YES', 'NO', 'ONLY_IF_NEEDED'];
const MIDLINE: MidlinePosition[] = ['CENTERED', 'SHIFTED_RIGHT', 'SHIFTED_LEFT'];

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
        chiefComplaint: values.chiefComplaint.trim(),
        canineRelationshipRight: values.canineRelationshipRight?.trim() || null,
        canineRelationshipLeft: values.canineRelationshipLeft?.trim() || null,
        molarRelationshipRight: values.molarRelationshipRight?.trim() || null,
        molarRelationshipLeft: values.molarRelationshipLeft?.trim() || null,
        avoidEngagersTeeth: values.avoidEngagersTeeth ?? [],
        extractTeeth: values.extractTeeth ?? [],
        leaveSpacesTeeth: values.leaveSpacesTeeth ?? [],
        doNotMoveTeeth: values.doNotMoveTeeth ?? [],
        additionalInstructions: values.additionalInstructions?.trim() || null,
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

  const selectClass = patientInputClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Chief complaint <span className="text-red-500">*</span>
        <textarea
          required
          minLength={10}
          disabled={readOnly}
          value={values.chiefComplaint}
          onChange={(e) => set('chiefComplaint', e.target.value)}
          rows={3}
          className={patientInputClass}
          placeholder="At least 10 characters"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={values.treatUpperArch}
            onChange={(e) => set('treatUpperArch', e.target.checked)}
          />
          Treat upper arch
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={values.treatLowerArch}
            onChange={(e) => set('treatLowerArch', e.target.checked)}
          />
          Treat lower arch
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={values.durationRecommended}
            onChange={(e) => set('durationRecommended', e.target.checked)}
          />
          Recommended duration
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={values.includeRetainer}
            onChange={(e) => set('includeRetainer', e.target.checked)}
          />
          Include retainer
        </label>
      </div>

      {!values.durationRecommended && (
        <label className="block text-sm font-medium text-slate-700">
          Duration limit (steps)
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

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Alignment goals</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['upperMidlineGoal', 'Upper midline'],
              ['lowerMidlineGoal', 'Lower midline'],
              ['overjetGoal', 'Overjet'],
              ['overbiteGoal', 'Overbite'],
              ['archFormGoal', 'Arch form'],
              ['canineRelationshipGoal', 'Canine'],
              ['molarRelationshipGoal', 'Molar'],
              ['posteriorRelationshipGoal', 'Posterior'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-muted">
              {label}
              <select
                disabled={readOnly}
                value={values[key]}
                onChange={(e) => set(key, e.target.value as AlignmentGoal)}
                className={selectClass}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Procedures</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['iprOption', 'IPR'],
              ['engagersOption', 'Engagers'],
              ['proclineOption', 'Procline'],
              ['expandOption', 'Expand'],
              ['distalizeOption', 'Distalize'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-muted">
              {label}
              <select
                disabled={readOnly}
                value={values[key]}
                onChange={(e) => set(key, e.target.value as ProcedureOption)}
                className={selectClass}
              >
                {PROCEDURES.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Existing condition — relationships
        </legend>
        <p className="mb-3 text-xs text-muted">
          Optional free text (e.g. Class I, Class II) for current canine and molar relationships.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['canineRelationshipRight', 'Canine (right)'],
              ['canineRelationshipLeft', 'Canine (left)'],
              ['molarRelationshipRight', 'Molar (right)'],
              ['molarRelationshipLeft', 'Molar (left)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-muted">
              {label}
              <input
                type="text"
                disabled={readOnly}
                value={values[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder="e.g. Class I"
                className={patientInputClass}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Upper midline
          <select
            disabled={readOnly}
            value={values.upperMidlinePosition}
            onChange={(e) => set('upperMidlinePosition', e.target.value as MidlinePosition)}
            className={selectClass}
          >
            {MIDLINE.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Lower midline
          <select
            disabled={readOnly}
            value={values.lowerMidlinePosition}
            onChange={(e) => set('lowerMidlinePosition', e.target.value as MidlinePosition)}
            className={selectClass}
          >
            {MIDLINE.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        {values.upperMidlinePosition !== 'CENTERED' && (
          <label className="block text-sm font-medium text-slate-700">
            Upper midline shift (mm)
            <input
              type="number"
              min={0.1}
              step={0.1}
              disabled={readOnly}
              value={values.upperMidlineShiftMm ?? ''}
              onChange={(e) =>
                set('upperMidlineShiftMm', e.target.value ? Number(e.target.value) : null)
              }
              className={patientInputClass}
            />
          </label>
        )}
        {values.lowerMidlinePosition !== 'CENTERED' && (
          <label className="block text-sm font-medium text-slate-700">
            Lower midline shift (mm)
            <input
              type="number"
              min={0.1}
              step={0.1}
              disabled={readOnly}
              value={values.lowerMidlineShiftMm ?? ''}
              onChange={(e) =>
                set('lowerMidlineShiftMm', e.target.value ? Number(e.target.value) : null)
              }
              className={patientInputClass}
            />
          </label>
        )}
      </div>

      <fieldset className="rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white p-4 shadow-sm">
        <legend className="px-1 text-sm font-semibold text-teal-900">
          Tooth-specific instructions
        </legend>
        <p id="tooth-notation-help" className="mb-4 text-xs text-teal-800/90">
          Use <strong>universal tooth numbering 1–32</strong> (not FDI 11–48). Enter comma- or
          space-separated numbers, then Add teeth. Upper right 1 → upper left 16 → lower left 17 →
          lower right 32.
        </p>
        <div className="space-y-3">
          <ToothSelectionField
            id="avoid-engagers-teeth"
            label="Avoid engagers"
            description="Teeth where attachments should not be placed."
            teeth={values.avoidEngagersTeeth ?? []}
            onChange={(t) => set('avoidEngagersTeeth', t)}
            readOnly={readOnly}
          />
          <ToothSelectionField
            id="extract-teeth"
            label="Extract"
            description="Teeth planned for extraction before or during treatment."
            teeth={values.extractTeeth ?? []}
            onChange={(t) => set('extractTeeth', t)}
            readOnly={readOnly}
          />
          <ToothSelectionField
            id="leave-spaces-teeth"
            label="Leave spaces"
            description="Teeth where spaces should be maintained."
            teeth={values.leaveSpacesTeeth ?? []}
            onChange={(t) => set('leaveSpacesTeeth', t)}
            readOnly={readOnly}
          />
          <ToothSelectionField
            id="do-not-move-teeth"
            label="Do not move"
            description="Teeth that should not be moved during aligner therapy."
            teeth={values.doNotMoveTeeth ?? []}
            onChange={(t) => set('doNotMoveTeeth', t)}
            readOnly={readOnly}
          />
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-slate-700">
        Additional instructions
        <textarea
          disabled={readOnly}
          value={values.additionalInstructions ?? ''}
          onChange={(e) => set('additionalInstructions', e.target.value)}
          rows={2}
          className={patientInputClass}
        />
      </label>

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save prescription'}
          </button>
          {onDelete && initial && (
            <button
              type="button"
              onClick={() => onDelete()}
              className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Remove prescription
            </button>
          )}
        </div>
      )}
    </form>
  );
}
