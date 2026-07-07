import { caseStatusLabel, statusBadgeClass } from '../lib/caseStatus';
import { useAppSelector } from '../store/hooks';
import type { CaseStatus } from '../types/case';

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const s = status as CaseStatus;
  const role = useAppSelector((st) => st.auth.user?.role);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s)}`}
    >
      {caseStatusLabel(s, role)}
    </span>
  );
}
