import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CaseFilesSection } from '../components/case/CaseFilesSection';
import { CaseSubmissionPanel } from '../components/case/CaseSubmissionPanel';
import { ClientReviewPanel } from '../components/case/ClientReviewPanel';
import { ClarificationBanner } from '../components/case/ClarificationBanner';
import { CommentsSection } from '../components/case/CommentsSection';
import { PaymentSection } from '../components/case/PaymentSection';
import { ProductionSection } from '../components/case/ProductionSection';
import { PrescriptionForm } from '../components/PrescriptionForm';
import { StatusBadge } from '../components/StatusBadge';
import { patientInputClass } from '../components/PatientForm';
import { Alert, Button, SkeletonCaseDetail, SkeletonForm } from '../components/ui';
import { useAppSelector } from '../store/hooks';
import { api, ApiError } from '../lib/api';
import { MAX, sanitizeText } from '../lib/sanitize';
import { toast } from '../lib/toast';
import { formatDisplayDate } from '../lib/patientDates';
import { formatCaseVersion } from '../lib/caseStatus';
import type { CaseRecord, Prescription, PrescriptionInput } from '../types/case';

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((s) => s.auth.user);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null | undefined>(
    undefined,
  );
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = useCallback(async () => {
    if (!id) return;
    const data = await api.get<{ case: CaseRecord }>(`/api/cases/${id}`);
    setCaseRecord(data.case);
    setNotes(data.case.notes ?? '');
  }, [id]);

  const loadPrescription = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.get<{ prescription: Prescription }>(
        `/api/cases/${id}/prescription`,
      );
      setPrescription(data.prescription);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPrescription(null);
      }
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCase();
        await loadPrescription();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load case');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCase, loadPrescription]);

  const saveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      const data = await api.patch<{ case: CaseRecord }>(`/api/cases/${id}/notes`, {
        notes: sanitizeText(notes, { maxLength: MAX.notes, multiline: true }),
      });
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const savePrescription = async (input: PrescriptionInput) => {
    if (!id) return;
    const data = await api.post<{ prescription: Prescription }>(
      `/api/cases/${id}/prescription`,
      input,
    );
    setPrescription(data.prescription);
  };

  const deletePrescription = async () => {
    if (!id || !confirm('Remove prescription?')) return;
    try {
      await api.delete(`/api/cases/${id}/prescription`);
      setPrescription(null);
      toast.success('Prescription removed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove prescription');
    }
  };

  const canEditPrescription =
    user?.role === 'CLIENT' &&
    caseRecord &&
    ['PENDING_PAYMENT', 'PENDING_APPROVAL'].includes(caseRecord.status);

  if (loading) {
    return <SkeletonCaseDetail sections={5} />;
  }

  if (error || !caseRecord) {
    return <Alert variant="error">{error ?? 'Case not found'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link to="/cases" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {caseRecord.patient?.name ?? 'Case'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Created {new Date(caseRecord.createdAt).toLocaleDateString()}
            {caseRecord.refinementCount > 0 &&
              ` · ${caseRecord.refinementCount} refinement(s)`}
            {` · v${formatCaseVersion(caseRecord)}`}
          </p>
        </div>
        <StatusBadge status={caseRecord.status} />
      </div>

      <ClarificationBanner caseRecord={caseRecord} onResolved={setCaseRecord} canResolve />

      {caseRecord.patient && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Patient</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Name</dt>
              <dd>
                <Link
                  to={`/patients/${caseRecord.patient.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {caseRecord.patient.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Date of birth</dt>
              <dd>{formatDisplayDate(caseRecord.patient.dateOfBirth)}</dd>
            </div>
          </dl>
        </section>
      )}

      <ClientReviewPanel caseRecord={caseRecord} onUpdate={setCaseRecord} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Case notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`mt-3 ${patientInputClass}`}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={saveNotes}
          loading={savingNotes}
          loadingText="Saving…"
          className="mt-3"
        >
          Save notes
        </Button>
      </section>

      <PaymentSection caseRecord={caseRecord} onCaseUpdate={setCaseRecord} />
      <CaseSubmissionPanel caseRecord={caseRecord} onSubmitted={setCaseRecord} />

      <CaseFilesSection caseId={caseRecord.id} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Prescription</h2>
        {prescription === undefined ? (
          <div className="mt-4">
            <SkeletonForm fields={3} />
          </div>
        ) : (
          <div className="mt-4">
            <PrescriptionForm
              initial={prescription}
              onSubmit={savePrescription}
              onDelete={canEditPrescription ? deletePrescription : undefined}
              readOnly={!canEditPrescription}
            />
          </div>
        )}
      </section>

      <ProductionSection caseId={caseRecord.id} />

      <CommentsSection caseId={caseRecord.id} canPost />

      {caseRecord.workflowLogs && caseRecord.workflowLogs.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Timeline</h2>
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
