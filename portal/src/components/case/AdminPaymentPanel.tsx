import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import type { CasePayment, PaymentStatus } from '../../types/case';

interface AdminPaymentPanelProps {
  caseId: string;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting confirmation',
  COMPLETED: 'Confirmed',
  FAILED: 'Failed',
};

export function AdminPaymentPanel({ caseId }: AdminPaymentPanelProps) {
  const [payments, setPayments] = useState<CasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const completePayment = async (paymentId: string) => {
    setActingId(paymentId);
    try {
      await api.post(`/api/payments/${paymentId}/complete`, {});
      await load();
      toast.success('Payment marked complete');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to complete payment');
    } finally {
      setActingId(null);
    }
  };

  const failPayment = async (paymentId: string) => {
    if (!confirm('Mark this payment as failed?')) return;
    setActingId(paymentId);
    try {
      await api.post(`/api/payments/${paymentId}/fail`, { reason: 'Rejected by admin' });
      await load();
      toast.success('Payment marked failed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update payment');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading payments…</p>;
  }

  if (payments.length === 0) {
    return <p className="text-sm text-muted">No payment records for this case.</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {payments.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm"
          >
            <div>
              <span className="font-medium text-ink">${p.amount.toFixed(2)}</span>
              <span className="ml-2 text-xs text-muted">
                {PAYMENT_STATUS_LABELS[p.status]}
              </span>
              <p className="text-xs text-muted">
                Recorded {new Date(p.createdAt).toLocaleString()}
              </p>
            </div>
            {p.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actingId === p.id}
                  onClick={() => completePayment(p.id)}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={actingId === p.id}
                  onClick={() => failPayment(p.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Fail
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
