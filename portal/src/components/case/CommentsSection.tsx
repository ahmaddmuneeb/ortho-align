import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { patientInputClass } from '../PatientForm';
import { FileUpload } from '../FileUpload';
import type { CaseComment } from '../../types/case';

interface CommentsSectionProps {
  caseId: string;
  canPost?: boolean;
  showInternal?: boolean;
  /** Override GET comments URL (e.g. patient portal). */
  commentsApiBase?: string;
}

export function CommentsSection({
  caseId,
  canPost = true,
  showInternal = false,
  commentsApiBase,
}: CommentsSectionProps) {
  const commentsUrl = commentsApiBase ?? `/api/cases/${caseId}/comments`;
  const user = useAppSelector((s) => s.auth.user);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ comments: CaseComment[] }>(commentsUrl);
      setComments(data.comments ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [commentsUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async (files?: File[]) => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('comment', text.trim());
      if (showInternal) formData.append('isInternal', String(isInternal));
      files?.forEach((f) => formData.append('files', f));
      await api.upload<{ comment: CaseComment }>(
        `/api/cases/${caseId}/comments`,
        formData,
      );
      setText('');
      setIsInternal(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await postComment();
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/api/cases/${caseId}/comments/${commentId}`);
      await load();
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete comment');
    }
  };

  const visible = comments.filter((c) => showInternal || !c.isInternal);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Comments</h2>

      {loading && <p className="mt-4 text-sm text-muted">Loading…</p>}
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {visible.length === 0 && !loading && (
          <li className="text-sm text-muted">No comments yet.</li>
        )}
        {visible.map((c) => (
          <li key={c.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium text-ink">{c.user?.name ?? 'User'}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleString()}
                  {c.isInternal && showInternal && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5">Internal</span>
                  )}
                </span>
                {(user?.role === 'ADMIN' || c.userId === user?.id) && (
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{c.comment}</p>
            {c.attachments && c.attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {c.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-700 hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {canPost && (
        <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-100 pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Add a comment…"
            className={patientInputClass}
            disabled={posting}
          />
          {showInternal && (
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal (staff only)
            </label>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
            <FileUpload
              label="Attach files"
              multiple
              maxFiles={5}
              onUpload={async (files) => {
                await postComment(files);
              }}
              disabled={posting || !text.trim()}
            />
          </div>
        </form>
      )}
    </section>
  );
}
