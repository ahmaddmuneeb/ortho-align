import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { MAX, sanitizeText } from '../../lib/sanitize';
import { patientInputClass } from '../PatientForm';
import { Alert, Button } from '../ui';
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
        {
          status,
          note:
            sanitizeText(note, { maxLength: MAX.transitionNote, multiline: true }) ||
            undefined,
        },
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
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
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
          <Button
            type="button"
            loading={loading}
            loadingText="Approving…"
            onClick={() => transition('APPROVED')}
            className="!bg-emerald-600 hover:!bg-emerald-700"
          >
            Approve
          </Button>
        )}
        {transitions.includes('CLIENT_REJECTED') && (
          <Button
            type="button"
            variant="secondary"
            loading={loading}
            loadingText="Sending…"
            onClick={() => transition('CLIENT_REJECTED')}
          >
            Request revision
          </Button>
        )}
      </div>
    </section>
  );
}
