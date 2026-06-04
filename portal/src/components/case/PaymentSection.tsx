import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { FileUpload } from '../FileUpload';
import { patientInputClass } from '../PatientForm';
import type { CasePayment, CaseRecord, PaymentStatus } from '../../types/case';

interface PaymentSectionProps {
  caseRecord: CaseRecord;
  onCaseUpdate: (c: CaseRecord) => void;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting confirmation',
  COMPLETED: 'Confirmed',
  FAILED: 'Failed',
};

function paymentStatusClass(status: PaymentStatus): string {
  if (status === 'COMPLETED') return 'text-emerald-700';
  if (status === 'FAILED') return 'text-red-700';
  return 'text-amber-800';
}

export function PaymentSection({ caseRecord, onCaseUpdate }: PaymentSectionProps) {
  const [payments, setPayments] = useState<CasePayment[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const caseId = caseRecord.id;
  const isPendingPayment = caseRecord.status === 'PENDING_PAYMENT';
  const hasProof = Boolean(caseRecord.paymentProofUrl);
  const latestPayment = payments[0];

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ payments: CasePayment[] }>(
        `/api/payments/case/${caseId}`,
      );
      setPayments(data.payments ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.post<{ payment: CasePayment }>('/api/payments', {
        caseId,
        amount: num,
      });
      setAmount('');
      await load();
      toast.success('Payment recorded');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create payment';
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const uploadProof = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploadingProof(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<{ paymentProofUrl: string }>(
        `/api/cases/${caseId}/payment-proof`,
        formData,
      );
      onCaseUpdate({ ...caseRecord, paymentProofUrl: result.paymentProofUrl });
      toast.success('Payment proof uploaded');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Proof upload failed';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setUploadingProof(false);
    }
  };

  const readyToSubmit = hasProof && payments.some((p) => p.status === 'PENDING' || p.status === 'COMPLETED');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Payment (PAYG)</h2>
      <p className="mt-1 text-sm text-muted">
        Pay as you go — record the amount paid, upload proof, then submit your case for review.
      </p>

      {isPendingPayment && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Payment required before submission</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-900/90">
            <li>Record the payment amount below</li>
            <li>Upload a receipt or bank transfer screenshot</li>
            <li>Use &quot;Submit for approval&quot; when files and prescription are ready</li>
          </ol>
        </div>
      )}

      {loading && <p className="mt-4 text-sm text-muted">Loading payments…</p>}
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {payments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-medium text-ink">${p.amount.toFixed(2)}</span>
              <span className={`text-xs font-medium ${paymentStatusClass(p.status)}`}>
                {PAYMENT_STATUS_LABELS[p.status]}
              </span>
              <span className="w-full text-xs text-muted">
                Recorded {new Date(p.createdAt).toLocaleString()}
                {p.paidAt && ` · Paid ${new Date(p.paidAt).toLocaleString()}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isPendingPayment && (
        <>
          <form onSubmit={createPayment} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-slate-700">
              Amount (USD)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={patientInputClass}
                placeholder="0.00"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Record payment'}
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <FileUpload
              label="Payment proof"
              hint="PDF, PNG, or JPG — max 10MB. Bank receipt or transfer confirmation."
              accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
              multiple={false}
              disabled={uploadingProof}
              onUpload={uploadProof}
            />
            {hasProof && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-emerald-800">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium">
                  Proof on file
                </span>
                <a
                  href={caseRecord.paymentProofUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 underline"
                >
                  View uploaded proof
                </a>
              </div>
            )}
            {!hasProof && latestPayment && (
              <p className="mt-2 text-xs text-amber-800">
                Payment recorded — upload proof to complete this step.
              </p>
            )}
          </div>

          {readyToSubmit && (
            <p className="mt-3 text-xs text-emerald-700">
              Payment steps look complete. You can submit the case when ready.
            </p>
          )}
        </>
      )}

      {!isPendingPayment && hasProof && (
        <p className="mt-4 text-sm text-muted">
          Payment proof on file ·{' '}
          <a
            href={caseRecord.paymentProofUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline"
          >
            View
          </a>
        </p>
      )}
    </section>
  );
}
