import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { fileCategoryLabel } from '../../lib/fileCategories';
import { toast } from '../../lib/toast';
import { FileUpload } from '../FileUpload';
import type { CaseFile, FileCategory } from '../../types/case';

const UPLOAD_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'SCAN', label: 'Intraoral scan' },
  { value: 'PHOTO', label: 'Clinical photo' },
  { value: 'XRAY', label: 'X-ray' },
  { value: 'OTHER', label: 'Other' },
];

interface CaseFilesSectionProps {
  caseId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  /** Production files appear in ProductionSection instead */
  hideProduction?: boolean;
}

export function CaseFilesSection({
  caseId,
  canUpload = true,
  canDelete = true,
  hideProduction = true,
}: CaseFilesSectionProps) {
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [category, setCategory] = useState<FileCategory>('SCAN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ files: CaseFile[] }>(`/api/cases/${caseId}/files`);
      const all = data.files ?? [];
      setFiles(
        hideProduction ? all.filter((f) => f.category !== 'PRODUCTION') : all,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (selected: File[]) => {
    const formData = new FormData();
    formData.append('category', category);
    selected.forEach((f) => formData.append('files', f));
    await api.upload<{ files: CaseFile[] }>(`/api/cases/${caseId}/files`, formData);
    await load();
    toast.success('Files uploaded');
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/api/cases/${caseId}/files/${fileId}`);
    await load();
    toast.success('File removed');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Case files</h2>

      {loading && <p className="mt-4 text-sm text-muted">Loading files…</p>}
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {canUpload && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FileCategory)}
              className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {UPLOAD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="min-w-[200px] flex-1">
            <FileUpload
              label="Upload files"
              hint="JPG, PNG, PDF, DICOM, STL — max 50MB each"
              onUpload={handleUpload}
            />
          </div>
        </div>
      )}

      {!loading && files.length === 0 && (
        <p className="mt-4 text-sm text-muted">No files uploaded yet.</p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
          {files.map((f) => (
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
                  {fileCategoryLabel(f.category)} · {(f.fileSize / 1024).toFixed(0)} KB
                </p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(f.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
