import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminPaymentPanel } from '../../components/case/AdminPaymentPanel';
import { CaseFilesSection } from '../../components/case/CaseFilesSection';
import { CommentsSection } from '../../components/case/CommentsSection';
import { ProductionSection } from '../../components/case/ProductionSection';
import { PrescriptionForm } from '../../components/PrescriptionForm';
import { StatusBadge } from '../../components/StatusBadge';
import { patientInputClass } from '../../components/PatientForm';
import { api, ApiError } from '../../lib/api';
import type { AdminUser, CaseRecord, Prescription } from '../../types/case';

export function AdminCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null | undefined>(
    undefined,
  );
  const [employees, setEmployees] = useState<AdminUser[]>([]);
  const [designerId, setDesignerId] = useState('');
  const [qcId, setQcId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api.get<{ case: CaseRecord }>(`/api/cases/${id}`);
    setCaseRecord(data.case);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        try {
          const rx = await api.get<{ prescription: Prescription }>(
            `/api/cases/${id}/prescription`,
          );
          if (!cancelled) setPrescription(rx.prescription);
        } catch {
          if (!cancelled) setPrescription(null);
        }
        const emp = await api.get<{ employees: AdminUser[] }>(
          '/api/users/employees',
        );
        if (!cancelled) setEmployees(emp.employees ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const designers = employees.filter(
    (e) => e.employeeType === 'DESIGNER' || e.employeeType === 'BOTH',
  );
  const qcs = employees.filter((e) => e.employeeType === 'QC' || e.employeeType === 'BOTH');

  const approvePayment = async () => {
    if (!id || !designerId || !qcId) {
      setError('Select designer and QC');
      return;
    }
    setActing(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/cases/${id}/approve-payment`,
        { designerId, qcId },
      );
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approval failed');
    } finally {
      setActing(false);
    }
  };

  const assignCase = async () => {
    if (!id || !designerId || !qcId) {
      setError('Select designer and QC');
      return;
    }
    setActing(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(`/api/cases/${id}/assign`, {
        designerId,
        qcId,
      });
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Assign failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!caseRecord) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error ?? 'Case not found'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/cases" className="text-sm font-medium text-brand-700 hover:underline">
        ← Cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">
          {caseRecord.patient?.name ?? 'Case'}
        </h1>
        <StatusBadge status={caseRecord.status} />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-muted">
          Client: {caseRecord.createdBy?.name} · Payment proof:{' '}
          {caseRecord.paymentProofUrl ? (
            <a
              href={caseRecord.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline"
            >
              View
            </a>
          ) : (
            'None'
          )}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Assign staff</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Designer
            <select
              value={designerId}
              onChange={(e) => setDesignerId(e.target.value)}
              className={patientInputClass}
            >
              <option value="">Select…</option>
              {designers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            QC
            <select
              value={qcId}
              onChange={(e) => setQcId(e.target.value)}
              className={patientInputClass}
            >
              <option value="">Select…</option>
              {qcs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {caseRecord.status === 'PENDING_APPROVAL' && (
            <button
              type="button"
              disabled={acting}
              onClick={approvePayment}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Approve payment & start design
            </button>
          )}
          {caseRecord.status === 'OPENED' && (
            <button
              type="button"
              disabled={acting}
              onClick={assignCase}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:border-brand-500 disabled:opacity-60"
            >
              Assign (opened → assigned)
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Payments</h2>
        <div className="mt-4">
          <AdminPaymentPanel caseId={caseRecord.id} />
        </div>
      </section>

      {prescription !== undefined && prescription && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Prescription</h2>
          <div className="mt-4">
            <PrescriptionForm initial={prescription} onSubmit={async () => {}} readOnly />
          </div>
        </section>
      )}

      <CaseFilesSection caseId={caseRecord.id} canUpload canDelete />
      <ProductionSection caseId={caseRecord.id} />
      <CommentsSection caseId={caseRecord.id} canPost showInternal />

      {caseRecord.workflowLogs && caseRecord.workflowLogs.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Workflow timeline</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {caseRecord.workflowLogs.map((log) => (
              <li key={log.id} className="text-muted">
                <span className="text-ink">
                  {log.fromStatus ? `${log.fromStatus} → ` : ''}
                  {log.toStatus}
                </span>
                {' · '}
                {new Date(log.createdAt).toLocaleString()}
                {log.performedBy && ` · ${log.performedBy.name}`}
                {log.note && (
                  <span className="block text-xs text-slate-500">{log.note}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
