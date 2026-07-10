import type { CaseRecord, CaseStatus, CaseWorkflowLog } from '../types/case';

export interface DoctorTimelineEvent {
  id: string;
  label: string;
  detail?: string;
  createdAt: string;
  version?: string | null;
}

/** Doctor-facing label for whitelisted transitions; anything else is dropped entirely. */
const DOCTOR_VISIBLE_EVENTS: Partial<Record<CaseStatus, string>> = {
  PENDING_QC: 'Treatment plan submitted',
  PENDING_CLIENT_REVIEW: 'Treatment plan submitted',
  CLIENT_REJECTED: 'Case rejected',
  APPROVED: 'Case approved',
  CANCELLED: 'Case cancelled',
};

/**
 * Filters + relabels the raw workflow log into what the client's spec calls "What the Doctor
 * Can See" — hides internal detail (which employee it was assigned to, QC-internal review
 * notes/reasons, internal team transfers, admin actions) while keeping doctor-relevant
 * milestones and their own comments.
 */
export function buildDoctorTimeline(caseRecord: CaseRecord): DoctorTimelineEvent[] {
  const logs = caseRecord.workflowLogs ?? [];
  const events: DoctorTimelineEvent[] = [];

  events.push({
    id: 'created',
    label: 'Case created',
    createdAt: caseRecord.createdAt,
    version: '1-1',
  });

  const sorted = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let revisionSeen = false;
  for (const log of sorted) {
    const label = DOCTOR_VISIBLE_EVENTS[log.toStatus];
    if (!label) continue;

    if (log.toStatus === 'PENDING_QC' || log.toStatus === 'PENDING_CLIENT_REVIEW') {
      // Only surface the first "submitted" event per version to avoid duplicate noise
      // (PENDING_QC -> PENDING_CLIENT_REVIEW both fire for the same submission).
      const version = log.version ?? undefined;
      const alreadyLogged = events.some(
        (e) => e.label.startsWith('Treatment plan') && e.version === version,
      );
      if (alreadyLogged) continue;
      events.push({
        id: log.id,
        label: revisionSeen ? 'Revision submitted' : 'Treatment plan submitted',
        createdAt: log.createdAt,
        version: log.version,
      });
      continue;
    }

    if (log.toStatus === 'CLIENT_REJECTED') {
      revisionSeen = true;
      events.push({
        id: log.id,
        label: 'Case rejected',
        detail: log.note ?? undefined,
        createdAt: log.createdAt,
        version: log.version,
      });
      continue;
    }

    events.push({
      id: log.id,
      label,
      createdAt: log.createdAt,
      version: log.version,
    });
  }

  if (caseRecord.caseNumber > 1) {
    events.unshift({
      id: 'refinement',
      label: `Refinement of an earlier case (case ${caseRecord.caseNumber})`,
      createdAt: caseRecord.createdAt,
      version: `${caseRecord.caseNumber}-1`,
    });
  }

  return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Employee/date summary the doctor is allowed to see, per spec: name + start/complete times only. */
export function doctorVisibleEmployeeInfo(caseRecord: CaseRecord): {
  name: string | null;
  startedAt: string | null;
  completedAt: string | null;
} {
  const logs = caseRecord.workflowLogs ?? [];
  const started = logs.find((l: CaseWorkflowLog) => l.toStatus === 'IN_DESIGN');
  const completed = [...logs]
    .reverse()
    .find((l: CaseWorkflowLog) => l.toStatus === 'APPROVED');

  return {
    name: caseRecord.designer?.name ?? null,
    startedAt: started?.createdAt ?? null,
    completedAt: completed?.createdAt ?? null,
  };
}
