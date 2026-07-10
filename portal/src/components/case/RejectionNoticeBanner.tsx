import type { CaseRecord } from '../../types/case';

interface RejectionNoticeBannerProps {
  caseRecord: CaseRecord;
}

/**
 * Stays visible through the whole revision cycle (accept -> re-upload -> resubmit -> QC
 * review), not just at the moment of rejection, so the doctor's requested changes are never
 * lost from view until the case is approved again.
 */
export function RejectionNoticeBanner({ caseRecord }: RejectionNoticeBannerProps) {
  if (caseRecord.revisionNumber <= 1 || caseRecord.status === 'APPROVED') return null;

  const latestRejection = [...(caseRecord.workflowLogs ?? [])]
    .filter((l) => l.toStatus === 'CLIENT_REJECTED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latestRejection) return null;

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
      <h2 className="text-lg font-semibold text-orange-900">Doctor revision request</h2>
      <p className="mt-1 text-sm text-orange-800/90">
        This case is on revision {caseRecord.revisionNumber} of case v{caseRecord.caseNumber}.
        The doctor's requested changes stay visible here until the case is approved again.
      </p>
      {latestRejection.note && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-sm text-slate-700">
          {latestRejection.note}
        </p>
      )}
      <p className="mt-2 text-xs text-orange-700/80">
        {new Date(latestRejection.createdAt).toLocaleString()}
        {latestRejection.performedBy?.name && ` · ${latestRejection.performedBy.name}`}
      </p>
    </section>
  );
}
