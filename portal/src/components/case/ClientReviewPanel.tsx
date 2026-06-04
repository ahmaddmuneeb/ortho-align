import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { patientInputClass } from '../PatientForm';
import type { CaseRecord, CaseStatus } from '../../types/case';

interface ClientReviewPanelProps {
  caseRecord: CaseRecord;
  onUpdate: (c: CaseRecord) => void;
}

export function ClientReviewPanel({ caseRecord, onUpdate }: ClientReviewPanelProps) {
  const [transitions, setTransitions] = useState<CaseStatus[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caseRecord.status !== 'PENDING_CLIENT_REVIEW') return;
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

  if (caseRecord.status !== 'PENDING_CLIENT_REVIEW') return null;

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-violet-900">Review design</h2>
      <p className="mt-1 text-sm text-violet-800/90">
        Approve the case or request revisions. Check production links below.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Note (optional for approval, recommended for rejection)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className={patientInputClass}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        {transitions.includes('APPROVED') && (
          <button
            type="button"
            disabled={loading}
            onClick={() => transition('APPROVED')}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Approve
          </button>
        )}
        {transitions.includes('CLIENT_REJECTED') && (
          <button
            type="button"
            disabled={loading}
            onClick={() => transition('CLIENT_REJECTED')}
            className="rounded-md border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-800 hover:bg-orange-50 disabled:opacity-60"
          >
            Request revision
          </button>
        )}
      </div>
    </section>
  );
}
