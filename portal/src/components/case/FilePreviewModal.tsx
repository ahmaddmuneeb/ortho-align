import { X } from 'lucide-react';
import type { CaseFile } from '../../types/case';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function isImage(file: CaseFile): boolean {
  return (
    file.mimeType.startsWith('image/') &&
    !file.fileName.toLowerCase().endsWith('.stl') &&
    IMAGE_EXTENSIONS.some((ext) => file.fileName.toLowerCase().endsWith(ext))
  );
}

function isPdf(file: CaseFile): boolean {
  return file.mimeType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
}

export function isPreviewable(file: CaseFile): boolean {
  return isImage(file) || isPdf(file);
}

interface FilePreviewModalProps {
  file: CaseFile;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-preview-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl animate-[modal-in_180ms_ease-out] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p id="file-preview-title" className="truncate text-sm font-medium text-ink">
            {file.fileName}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50">
          {isImage(file) && (
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="mx-auto max-h-[75vh] w-auto object-contain"
            />
          )}
          {isPdf(file) && (
            <iframe title={file.fileName} src={file.fileUrl} className="h-[75vh] w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
