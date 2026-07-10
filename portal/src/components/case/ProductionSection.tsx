import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { fileCategoryLabel } from '../../lib/fileCategories';
import { MAX, sanitizeText, sanitizeUrl } from '../../lib/sanitize';
import { patientInputClass } from '../PatientForm';
import { Alert, Button } from '../ui';
import { SkeletonText } from '../ui/Skeleton';
import type { CaseFile, ProductionUrl } from '../../types/case';

interface ProductionSectionProps {
  caseId: string;
  canAddUrl?: boolean;
  canUploadFiles?: boolean;
  /** Increment to reload files/URLs after uploads elsewhere */
  refreshKey?: number;
}

export function ProductionSection({
  caseId,
  canAddUrl = false,
  canUploadFiles = false,
  refreshKey = 0,
}: ProductionSectionProps) {
  const [urls, setUrls] = useState<ProductionUrl[]>([]);
  const [productionFiles, setProductionFiles] = useState<CaseFile[]>([]);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUrl, setSavingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [urlData, fileData] = await Promise.all([
        api.get<{ productionUrls: ProductionUrl[] }>(
          `/api/cases/${caseId}/production/urls`,
        ),
        api.get<{ files: CaseFile[] }>(`/api/cases/${caseId}/production/files`),
      ]);
      setUrls(urlData.productionUrls ?? []);
      setProductionFiles(fileData.files ?? []);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setUrls([]);
        setProductionFiles([]);
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load production');
      }
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSavingUrl(true);
    setError(null);
    try {
      await api.post(`/api/cases/${caseId}/production/urls`, {
        url: sanitizeUrl(url),
        description:
          sanitizeText(description, { maxLength: MAX.productionDescription }) ||
          undefined,
      });
      setUrl('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add URL');
    } finally {
      setSavingUrl(false);
    }
  };

  const deleteUrl = async (urlId: string) => {
    await api.delete(`/api/cases/${caseId}/production/urls/${urlId}`);
    await load();
  };

  const hasContent = urls.length > 0 || productionFiles.length > 0;

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Production deliverables</h2>
        <div className="mt-4">
          <SkeletonText lines={2} />
        </div>
      </section>
    );
  }

  if (!hasContent && !canAddUrl && !canUploadFiles && !error) {
    return null;
  }

  return (
    <section className="rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Production deliverables</h2>
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
          Final outputs
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Aligner plans, staging files, and links shared when your case is in production or
        complete.
      </p>

      {error && (
        <div className="mt-2">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {productionFiles.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-slate-700">Production files</h3>
          <ul className="mt-2 divide-y divide-teal-100 rounded-lg border border-teal-100 bg-white/80">
            {productionFiles.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {f.fileName}
                  </a>
                  <p className="text-xs text-muted">
                    {fileCategoryLabel('PRODUCTION')} · {(f.fileSize / 1024).toFixed(0)} KB
                    {f.uploadedAt && ` · ${new Date(f.uploadedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {urls.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-slate-700">Production links</h3>
          <ul className="mt-2 space-y-2">
            {urls.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-teal-100 bg-white/80 px-4 py-3 text-sm"
              >
                <div>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {u.description || u.url}
                  </a>
                  {u.description && (
                    <p className="mt-0.5 truncate text-xs text-muted">{u.url}</p>
                  )}
                  {u.addedBy && (
                    <p className="mt-1 text-xs text-muted">Added by {u.addedBy.name}</p>
                  )}
                </div>
                {canAddUrl && (
                  <button
                    type="button"
                    onClick={() => deleteUrl(u.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasContent && !canAddUrl && (
        <div className="mt-4">
          <Alert variant="info">No production deliverables yet.</Alert>
        </div>
      )}

      {canAddUrl && (
        <form onSubmit={addUrl} className="mt-4 space-y-3 border-t border-teal-100 pt-4">
          <label className="block text-sm font-medium text-slate-700">
            Production URL
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={patientInputClass}
              placeholder="https://…"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={patientInputClass}
            />
          </label>
          <Button type="submit" loading={savingUrl} loadingText="Adding…">
            Add URL
          </Button>
        </form>
      )}

      {canUploadFiles && (
        <p className="mt-4 text-xs text-muted">
          Upload production files from the designer actions panel above (saved as production
          deliverables).
        </p>
      )}
    </section>
  );
}
