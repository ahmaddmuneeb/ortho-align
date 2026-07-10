import { X } from 'lucide-react';
import { buildDoctorTimeline, doctorVisibleEmployeeInfo } from '../../lib/doctorTimeline';
import type { CaseRecord } from '../../types/case';

interface TimelineModalProps {
  caseRecord: CaseRecord;
  onClose: () => void;
}

export function TimelineModal({ caseRecord, onClose }: TimelineModalProps) {
  const events = buildDoctorTimeline(caseRecord);
  const employeeInfo = doctorVisibleEmployeeInfo(caseRecord);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-dialog-title"
        className="relative max-h-[85vh] w-full max-w-lg animate-[modal-in_180ms_ease-out] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <h2 id="timeline-dialog-title" className="text-lg font-semibold text-ink">
          Case history
        </h2>

        {employeeInfo.name && (
          <p className="mt-1 text-sm text-muted">
            Completed by <span className="font-medium text-ink">{employeeInfo.name}</span>
            {employeeInfo.startedAt &&
              ` · started ${new Date(employeeInfo.startedAt).toLocaleDateString()}`}
            {employeeInfo.completedAt &&
              ` · completed ${new Date(employeeInfo.completedAt).toLocaleDateString()}`}
          </p>
        )}

        <ol className="mt-5 space-y-4 border-l border-slate-200 pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <p className="text-sm font-medium text-ink">
                {event.label}
                {event.version && (
                  <span className="ml-1.5 font-mono text-xs font-normal text-muted">
                    (v{event.version})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">{new Date(event.createdAt).toLocaleString()}</p>
              {event.detail && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{event.detail}</p>
              )}
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-sm text-muted">No history yet.</li>
          )}
        </ol>
      </div>
    </div>
  );
}
