import { CASE_STATUS_LABELS, statusBadgeClass } from '../lib/caseStatus';
import type { CaseStatus } from '../types/case';

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const s = status as CaseStatus;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s)}`}
    >
      {CASE_STATUS_LABELS[s] ?? status}
    </span>
  );
}
