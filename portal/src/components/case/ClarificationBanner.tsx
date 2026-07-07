import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { Alert, Button } from '../ui';
import type { CaseClarification, CaseRecord } from '../../types/case';

const CATEGORY_LABELS: Record<string, string> = {
  WRONG_FILES: 'Wrong files uploaded',
  MISSING_SCANS: 'Missing upper or lower scans',
  DISTORTED_SCAN_DATA: 'Distorted scan data',
  MISMATCHED_PATIENT_DATA: 'Mismatched patient data',
  MISSING_RECORDS: 'Missing records',
  POOR_SCAN_QUALITY: 'Poor scan quality',
  OTHER_TECHNICAL_ISSUE: 'Other technical issue',
};

interface ClarificationBannerProps {
  caseRecord: CaseRecord;
  onResolved: (caseRecord: CaseRecord) => void;
  /** Doctor can resubmit; admin can only view. */
  canResolve?: boolean;
}

export function ClarificationBanner({
  caseRecord,
  onResolved,
  canResolve = false,
}: ClarificationBannerProps) {
  const [clarifications, setClarifications] = useState<CaseClarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ clarifications: CaseClarification[] }>(
        `/api/cases/${caseRecord.id}/clarifications`,
      );
      setClarifications(data.clarifications ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load clarification');
    } finally {
      setLoading(false);
    }
  }, [caseRecord.id]);

  useEffect(() => {
    if (caseRecord.status !== 'CLARIFICATION_REQUESTED') return;
    load();
  }, [caseRecord.status, load]);

  if (caseRecord.status !== 'CLARIFICATION_REQUESTED') return null;

  const latest = clarifications.find((c) => !c.resolvedAt) ?? clarifications[0];

  const resubmit = async () => {
    if (!latest) return;
    setResolving(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/cases/${caseRecord.id}/clarifications/${latest.id}/resolve`,
        {},
      );
      onResolved(data.case);
      toast.success('Case resubmitted to the team');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resubmit case');
    } finally {
      setResolving(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-amber-900">Clarification required</h2>
      <p className="mt-1 text-sm text-amber-800/90">
        The assigned team member found an issue and sent this case back before starting work.
      </p>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && <p className="mt-3 text-sm text-amber-800/80">Loading…</p>}

      {!loading && latest && (
        <div className="mt-4 rounded-lg bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {CATEGORY_LABELS[latest.category] ?? latest.category}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{latest.message}</p>
          {latest.attachments && latest.attachments.length > 0 && (
            <ul className="mt-3 space-y-1">
              {latest.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-700 hover:underline"
                  >
                    {a.fileName}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Reported by {latest.requestedBy?.name ?? 'the team'} on{' '}
            {new Date(latest.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {canResolve && (
        <div className="mt-4">
          <p className="text-sm text-amber-800/90">
            Update the case files/details above to fix the issue, then resubmit.
          </p>
          <Button
            type="button"
            loading={resolving}
            loadingText="Resubmitting…"
            onClick={resubmit}
            className="mt-3 !bg-amber-600 hover:!bg-amber-700"
            disabled={!latest}
          >
            Resubmit to team
          </Button>
        </div>
      )}
    </section>
  );
}
