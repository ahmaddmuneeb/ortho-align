import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { Alert, Button } from '../ui';
import type { CaseRecord } from '../../types/case';

interface CaseSubmissionPanelProps {
  caseRecord: CaseRecord;
  onSubmitted: (c: CaseRecord) => void;
}

export function CaseSubmissionPanel({ caseRecord, onSubmitted }: CaseSubmissionPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (caseRecord.status !== 'PENDING_PAYMENT') {
    return null;
  }

  const handleSubmit = async () => {
    if (
      !confirm(
        'Submit this case for admin approval? Ensure files, prescription, and payment proof are complete.',
      )
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/cases/${caseRecord.id}/submit`,
        {},
      );
      onSubmitted(data.case);
      toast.success('Case submitted for approval');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Submission failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-brand-200 bg-brand-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-800">Submit case</h2>
      <p className="mt-1 text-sm text-brand-900/80">
        When payment, files, and prescription are ready, submit for OrthoAlign review.
      </p>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <Button
        type="button"
        onClick={handleSubmit}
        loading={submitting}
        loadingText="Submitting…"
        className="mt-4"
      >
        Submit for approval
      </Button>
    </section>
  );
}
