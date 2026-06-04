import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { CASE_STATUS_LABELS } from '../../lib/caseStatus';
import { toast } from '../../lib/toast';
import { patientInputClass } from '../PatientForm';
import type { CaseRecord, CaseStatus } from '../../types/case';

interface AdminWorkflowPanelProps {
  caseRecord: CaseRecord;
  onUpdate: (c: CaseRecord) => void;
}

export function AdminWorkflowPanel({ caseRecord, onUpdate }: AdminWorkflowPanelProps) {
  const [transitions, setTransitions] = useState<CaseStatus[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ availableTransitions: CaseStatus[] }>(
          `/api/cases/${caseRecord.id}/available-transitions`,
        );
        if (!cancelled) setTransitions(data.availableTransitions ?? []);
      } catch {
        if (!cancelled) setTransitions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseRecord.id, caseRecord.status]);

  if (transitions.length === 0) return null;

  const transition = async (status: CaseStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/cases/${caseRecord.id}/transition`,
        { status, note: note.trim() || undefined },
      );
      onUpdate(data.case);
      setNote('');
      toast.success(`Status updated to ${CASE_STATUS_LABELS[status]}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Transition failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-brand-200 bg-brand-50/50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Workflow actions</h2>
      <p className="mt-1 text-sm text-muted">
        Admin transitions available from {CASE_STATUS_LABELS[caseRecord.status]}
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Note (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className={patientInputClass}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        {transitions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={loading}
            onClick={() => transition(status)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            → {CASE_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </section>
  );
}
