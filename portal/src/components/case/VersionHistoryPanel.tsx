import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { Alert } from '../ui';
import { SkeletonText } from '../ui/Skeleton';
import type { CaseFile, CaseRecord, ProductionUrl } from '../../types/case';

interface VersionGroup {
  version: string;
  submittedAt: string | null;
  submittedBy: string | null;
  reviewStatus: 'Approved' | 'Rejected' | 'In review' | 'Not yet submitted';
  qcStatus: 'Approved' | 'Pending' | 'Not yet reviewed';
  doctorComment: string | null;
  files: CaseFile[];
  productionUrls: ProductionUrl[];
}

function compareVersions(a: string, b: string): number {
  const [aCase, aRev] = a.split('-').map(Number);
  const [bCase, bRev] = b.split('-').map(Number);
  return aCase !== bCase ? aCase - bCase : aRev - bRev;
}

function buildVersionHistory(
  caseRecord: CaseRecord,
  files: CaseFile[],
  productionUrls: ProductionUrl[],
): VersionGroup[] {
  const versions = new Set<string>();
  versions.add(`${caseRecord.caseNumber}-${caseRecord.revisionNumber}`);
  files.forEach((f) => versions.add(f.version));
  productionUrls.forEach((p) => versions.add(p.version));
  (caseRecord.workflowLogs ?? []).forEach((l) => l.version && versions.add(l.version));

  return Array.from(versions)
    .sort(compareVersions)
    .reverse()
    .map((version) => {
      const logs = (caseRecord.workflowLogs ?? []).filter((l) => l.version === version);
      const submitLog = logs.find((l) => l.toStatus === 'PENDING_QC');
      const qcApproveLog = logs.find((l) => l.toStatus === 'PENDING_CLIENT_REVIEW');
      const clientRejectLog = logs.find((l) => l.toStatus === 'CLIENT_REJECTED');
      const approvedLog = logs.find((l) => l.toStatus === 'APPROVED');

      let reviewStatus: VersionGroup['reviewStatus'] = 'Not yet submitted';
      if (approvedLog) reviewStatus = 'Approved';
      else if (clientRejectLog) reviewStatus = 'Rejected';
      else if (submitLog) reviewStatus = 'In review';

      let qcStatus: VersionGroup['qcStatus'] = 'Not yet reviewed';
      if (qcApproveLog) qcStatus = 'Approved';
      else if (submitLog) qcStatus = 'Pending';

      return {
        version,
        submittedAt: submitLog?.createdAt ?? null,
        submittedBy: submitLog?.performedBy?.name ?? null,
        reviewStatus,
        qcStatus,
        doctorComment: clientRejectLog?.note ?? null,
        files: files.filter((f) => f.version === version),
        productionUrls: productionUrls.filter((p) => p.version === version),
      };
    });
}

const STATUS_BADGE_CLASS: Record<VersionGroup['reviewStatus'], string> = {
  Approved: 'bg-emerald-50 text-emerald-800',
  Rejected: 'bg-orange-50 text-orange-800',
  'In review': 'bg-indigo-50 text-indigo-800',
  'Not yet submitted': 'bg-slate-100 text-slate-600',
};

interface VersionHistoryPanelProps {
  caseRecord: CaseRecord;
}

export function VersionHistoryPanel({ caseRecord }: VersionHistoryPanelProps) {
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [productionUrls, setProductionUrls] = useState<ProductionUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fileData, urlData] = await Promise.all([
          api.get<{ files: CaseFile[] }>(`/api/cases/${caseRecord.id}/files`),
          api.get<{ productionUrls: ProductionUrl[] }>(
            `/api/cases/${caseRecord.id}/production/urls`,
          ),
        ]);
        if (!cancelled) {
          setFiles(fileData.files ?? []);
          setProductionUrls(urlData.productionUrls ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load version history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseRecord.id]);

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SkeletonText lines={4} />
      </section>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const groups = buildVersionHistory(caseRecord, files, productionUrls);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section
          key={g.version}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-lg font-semibold text-ink">Version {g.version}</h3>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[g.reviewStatus]}`}
            >
              {g.reviewStatus}
            </span>
          </div>

          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Submitted</dt>
              <dd>{g.submittedAt ? new Date(g.submittedAt).toLocaleString() : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Uploaded by</dt>
              <dd>{g.submittedBy ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">QC status</dt>
              <dd>{g.qcStatus}</dd>
            </div>
          </dl>

          {g.doctorComment && (
            <div className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Doctor comments
              </p>
              <p className="mt-1 whitespace-pre-wrap">{g.doctorComment}</p>
            </div>
          )}

          {(g.files.length > 0 || g.productionUrls.length > 0) && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              {g.files.length > 0 && (
                <ul className="space-y-1">
                  {g.files.map((f) => (
                    <li key={f.id}>
                      <a
                        href={f.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-700 hover:underline"
                      >
                        {f.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {g.productionUrls.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {g.productionUrls.map((p) => (
                    <li key={p.id}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-700 hover:underline"
                      >
                        {p.description || p.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      ))}
      {groups.length === 0 && <Alert variant="info">No versions yet.</Alert>}
    </div>
  );
}
