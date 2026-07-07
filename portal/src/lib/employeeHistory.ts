import type { CaseRecord } from '../types/case';

export type CaseTypeLabel = 'New case' | 'Refinement';

export function caseTypeLabel(c: CaseRecord): CaseTypeLabel {
  return c.caseNumber > 1 ? 'Refinement' : 'New case';
}

export function assignedDate(c: CaseRecord): string | null {
  const log = c.workflowLogs?.find((l) => l.toStatus === 'ASSIGNED');
  return log?.createdAt ?? null;
}

export function completedDate(c: CaseRecord): string | null {
  const log = [...(c.workflowLogs ?? [])].reverse().find((l) => l.toStatus === 'APPROVED');
  return log?.createdAt ?? null;
}

export type HistorySortKey = 'updated' | 'assigned' | 'status' | 'caseId';

export function filterAndSortHistory(
  cases: CaseRecord[],
  opts: {
    search?: string;
    status?: string;
    doctorId?: string;
    sortKey?: HistorySortKey;
  },
): CaseRecord[] {
  const search = opts.search?.trim().toLowerCase();
  let result = cases;

  if (search) {
    result = result.filter(
      (c) =>
        c.id.toLowerCase().includes(search) ||
        c.patient?.name?.toLowerCase().includes(search) ||
        c.createdBy?.name?.toLowerCase().includes(search),
    );
  }

  if (opts.status) {
    result = result.filter((c) => c.status === opts.status);
  }

  if (opts.doctorId) {
    result = result.filter((c) => c.createdById === opts.doctorId);
  }

  const sortKey = opts.sortKey ?? 'updated';
  result = [...result].sort((a, b) => {
    switch (sortKey) {
      case 'assigned': {
        const aDate = assignedDate(a) ?? a.createdAt;
        const bDate = assignedDate(b) ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }
      case 'status':
        return a.status.localeCompare(b.status);
      case 'caseId':
        return a.id.localeCompare(b.id);
      case 'updated':
      default:
        return (
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
        );
    }
  });

  return result;
}
