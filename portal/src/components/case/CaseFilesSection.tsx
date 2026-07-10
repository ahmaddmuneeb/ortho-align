import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { FileUpload } from '../FileUpload';
import { StlViewer } from './StlViewer';
import { FilePreviewModal, isPreviewable } from './FilePreviewModal';
import { Alert } from '../ui';
import { SkeletonText } from '../ui/Skeleton';
import type { CaseFile, FileCategory } from '../../types/case';

interface FileSectionSpec {
  category: FileCategory;
  title: string;
  uploadLabel: string;
  hint: string;
}

const FILE_SECTIONS: FileSectionSpec[] = [
  {
    category: 'PHOTO',
    title: 'Clinical images',
    uploadLabel: 'Upload clinical photos',
    hint: 'JPG, PNG — max 50MB each',
  },
  {
    category: 'XRAY',
    title: 'X-rays',
    uploadLabel: 'Upload X-rays',
    hint: 'JPG, PNG, PDF — max 50MB each',
  },
  {
    category: 'SCAN',
    title: 'Scans',
    uploadLabel: 'Upload intraoral scans',
    hint: 'STL, DICOM, PDF — max 50MB each',
  },
  {
    category: 'OTHER',
    title: 'Other documents',
    uploadLabel: 'Upload other files',
    hint: 'Max 50MB each',
  },
];

function isStl(file: CaseFile): boolean {
  return file.fileName.toLowerCase().endsWith('.stl');
}

interface CaseFilesSectionProps {
  caseId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export function CaseFilesSection({
  caseId,
  canUpload = true,
  canDelete = true,
}: CaseFilesSectionProps) {
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<CaseFile | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ files: CaseFile[] }>(`/api/cases/${caseId}/files`);
      setFiles((data.files ?? []).filter((f) => f.category !== 'PRODUCTION'));
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

  const handleUpload = (category: FileCategory) => async (selected: File[]) => {
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

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Case files</h2>
        <div className="mt-4">
          <SkeletonText lines={3} />
        </div>
      </section>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div id="case-files" className="space-y-4">
      {FILE_SECTIONS.map((spec) => {
        const sectionFiles = files.filter((f) => f.category === spec.category);
        return (
          <section
            key={spec.category}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold text-ink">{spec.title}</h3>

            {canUpload && (
              <div className="mt-3">
                <FileUpload
                  label={spec.uploadLabel}
                  hint={spec.hint}
                  onUpload={handleUpload(spec.category)}
                />
              </div>
            )}

            {sectionFiles.length === 0 && (
              <p className="mt-3 text-sm text-muted">No files uploaded yet.</p>
            )}

            {sectionFiles.length > 0 && (
              <ul className="mt-3 space-y-3">
                {sectionFiles.map((f) => (
                  <li key={f.id} className="rounded-lg border border-slate-100">
                    {spec.category === 'SCAN' && isStl(f) ? (
                      <div className="p-3">
                        <StlViewer fileUrl={f.fileUrl} />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-ink">{f.fileName}</span>
                          <div className="flex items-center gap-3">
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-700 hover:underline"
                            >
                              Download
                            </a>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(f.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <div>
                          {isPreviewable(f) ? (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(f)}
                              className="font-medium text-brand-700 hover:underline"
                            >
                              {f.fileName}
                            </button>
                          ) : (
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-brand-700 hover:underline"
                            >
                              {f.fileName}
                            </a>
                          )}
                          <p className="text-xs text-muted">
                            {(f.fileSize / 1024).toFixed(0)} KB
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
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
