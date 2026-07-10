import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCaseVersion } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { Alert, Button } from '../../components/ui';
import { CaseListSkeleton } from '../../components/CaseList';
import type { CaseRecord } from '../../types/case';

export function OpenQcQueuePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ cases: CaseRecord[] }>('/api/qc/queue');
      setCases(data.cases ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the open QC queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (caseId: string) => {
    setClaimingId(caseId);
    try {
      await api.post(`/api/qc/cases/${caseId}/claim`, {});
      toast.success('Case claimed — it now belongs in your QC queue');
      navigate(`/employee/cases/${caseId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to claim case');
      setClaimingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Open QC queue</h1>
      <p className="mt-1 text-sm text-muted">
        Cases ready for QC review that don't have a reviewer assigned yet — claim one to start.
      </p>

      {loading && <CaseListSkeleton />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {cases.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              No unclaimed cases right now.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cases.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className="font-mono text-xs text-muted">
                        v{formatCaseVersion(c)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {c.patient?.name ?? c.patientId}
                    </p>
                    <p className="text-xs text-muted">
                      Designer: {c.designer?.name ?? '—'} · Doctor: {c.createdBy?.name ?? '—'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    loading={claimingId === c.id}
                    loadingText="Claiming…"
                    onClick={() => claim(c.id)}
                  >
                    Claim
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
