import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CommentsSection } from '../../components/case/CommentsSection';
import { StatusBadge } from '../../components/StatusBadge';
import { CASE_STATUS_LABELS } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import { Alert, SkeletonCaseDetail } from '../../components/ui';
import type { CaseFile, CaseRecord, CaseWorkflowLog } from '../../types/case';

export function PatientCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const [caseRes, filesRes] = await Promise.all([
      api.get<{ case: CaseRecord }>(`/api/patient/cases/${id}`),
      api.get<{ files: CaseFile[] }>(`/api/patient/cases/${id}/files`),
    ]);
    setCaseRecord(caseRes.case);
    setFiles(filesRes.files ?? []);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load case');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) return <SkeletonCaseDetail sections={3} />;
  if (error || !caseRecord) {
    return (
      <div>
        <Alert variant="error">{error ?? 'Case not found'}</Alert>
        <Link
          to="/patient/cases"
          className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Back to cases
        </Link>
      </div>
    );
  }

  const logs = (caseRecord.workflowLogs ?? []) as CaseWorkflowLog[];

  return (
    <div className="space-y-6">
      <Link
        to="/patient/cases"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← My cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Case status</h1>
          <p className="mt-1 font-mono text-xs text-muted">{caseRecord.id}</p>
        </div>
        <StatusBadge status={caseRecord.status} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="font-medium text-ink">{CASE_STATUS_LABELS[caseRecord.status]}</dd>
          </div>
          <div>
            <dt className="text-muted">Last updated</dt>
            <dd>{new Date(caseRecord.updatedAt).toLocaleString()}</dd>
          </div>
          {caseRecord.notes && (
            <div className="sm:col-span-2">
              <dt className="text-muted">Notes from clinic</dt>
              <dd className="whitespace-pre-wrap text-ink">{caseRecord.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      {logs.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Timeline</h2>
          <ol className="mt-4 space-y-3 border-l-2 border-brand-100 pl-4">
            {logs.map((log) => (
              <li key={log.id} className="text-sm">
                <p className="font-medium text-ink">
                  {log.fromStatus
                    ? `${CASE_STATUS_LABELS[log.fromStatus]} → `
                    : ''}
                  {CASE_STATUS_LABELS[log.toStatus]}
                </p>
                <p className="text-xs text-muted">
                  {new Date(log.createdAt).toLocaleString()}
                  {log.note ? ` · ${log.note}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Files</h2>
        {files.length === 0 ? (
          <div className="mt-3">
            <Alert variant="info">No files uploaded yet.</Alert>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {f.category} · {f.fileName}
                </span>
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {id && (
        <CommentsSection caseId={id} canPost={false} commentsApiBase={`/api/patient/cases/${id}/comments`} />
      )}
    </div>
  );
}
