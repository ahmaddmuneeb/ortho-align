import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PatientPortalAccessPanel } from '../../components/PatientPortalAccessPanel';
import { AdminPaymentPanel } from '../../components/case/AdminPaymentPanel';
import { AdminWorkflowPanel } from '../../components/case/AdminWorkflowPanel';
import { CaseFilesSection } from '../../components/case/CaseFilesSection';
import { ClarificationBanner } from '../../components/case/ClarificationBanner';
import { CommentsSection } from '../../components/case/CommentsSection';
import { ProductionSection } from '../../components/case/ProductionSection';
import { PrescriptionForm } from '../../components/PrescriptionForm';
import { StatusBadge } from '../../components/StatusBadge';
import { patientInputClass } from '../../components/PatientForm';
import { CASE_STATUS_LABELS, formatCaseVersion } from '../../lib/caseStatus';
import { api, ApiError } from '../../lib/api';
import { MAX, sanitizeText } from '../../lib/sanitize';
import { toast } from '../../lib/toast';
import { Alert, Button, SkeletonCaseDetail } from '../../components/ui';
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
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api.get<{ case: CaseRecord }>(`/api/cases/${id}`);
    setCaseRecord(data.case);
    setNotes(data.case.notes ?? '');
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
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
  }, [id, load]);

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
      toast.success('Payment approved — case in design');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Approval failed';
      setError(msg);
      toast.error(msg);
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
      toast.success('Case assigned');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Assign failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const saveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    setError(null);
    try {
      const data = await api.patch<{ case: CaseRecord }>(`/api/cases/${id}/notes`, {
        notes: sanitizeText(notes, { maxLength: MAX.notes, multiline: true }),
      });
      setCaseRecord(data.case);
      toast.success('Notes saved');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save notes';
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <SkeletonCaseDetail sections={6} />;
  if (!caseRecord) {
    return <Alert variant="error">{error ?? 'Case not found'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/cases" className="text-sm font-medium text-brand-700 hover:underline">
        ← Cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {caseRecord.patient?.name ?? 'Case'}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">{caseRecord.id}</p>
        </div>
        <StatusBadge status={caseRecord.status} />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <ClarificationBanner caseRecord={caseRecord} onResolved={setCaseRecord} />

      {caseRecord.patientId && caseRecord.patient?.name && (
        <PatientPortalAccessPanel
          patientId={caseRecord.patientId}
          patientName={caseRecord.patient.name}
        />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Case details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="font-medium text-ink">
              {CASE_STATUS_LABELS[caseRecord.status]}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Client</dt>
            <dd className="font-medium text-ink">
              {caseRecord.createdBy?.name ?? '—'}
              {caseRecord.createdBy?.email && (
                <span className="block text-xs font-normal text-muted">
                  {caseRecord.createdBy.email}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Designer</dt>
            <dd>{caseRecord.designer?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">QC</dt>
            <dd>{caseRecord.qc?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Created</dt>
            <dd>{new Date(caseRecord.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted">Version</dt>
            <dd className="font-mono">{formatCaseVersion(caseRecord)}</dd>
          </div>
          <div>
            <dt className="text-muted">Due date</dt>
            <dd>{caseRecord.dueDate ? new Date(caseRecord.dueDate).toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Payment proof</dt>
            <dd>
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
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Case notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={`${patientInputClass} mt-4`}
          placeholder="Internal or case notes"
        />
        <Button
          type="button"
          onClick={saveNotes}
          loading={savingNotes}
          loadingText="Saving…"
          className="mt-3"
        >
          Save notes
        </Button>
      </section>

      <AdminWorkflowPanel caseRecord={caseRecord} onUpdate={setCaseRecord} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Assign staff</h2>
        <p className="mt-1 text-sm text-muted">
          Approve pending submissions or assign when case is opened
        </p>
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
            <Button
              type="button"
              loading={acting}
              loadingText="Approving…"
              onClick={approvePayment}
            >
              Approve payment & start design
            </Button>
          )}
          {caseRecord.status === 'OPENED' && (
            <Button
              type="button"
              variant="secondary"
              loading={acting}
              loadingText="Assigning…"
              onClick={assignCase}
            >
              Assign (opened → assigned)
            </Button>
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
