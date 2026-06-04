import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CaseFilesSection } from '../../components/case/CaseFilesSection';
import { CommentsSection } from '../../components/case/CommentsSection';
import { ProductionSection } from '../../components/case/ProductionSection';
import { PrescriptionForm } from '../../components/PrescriptionForm';
import { FileUpload } from '../../components/FileUpload';
import { StatusBadge } from '../../components/StatusBadge';
import { patientInputClass } from '../../components/PatientForm';
import { getEmployeeHomePath } from '../../lib/routes';
import { useAppSelector } from '../../store/hooks';
import { api, ApiError } from '../../lib/api';
import { MAX, sanitizeText } from '../../lib/sanitize';
import { toast } from '../../lib/toast';
import { Alert, Button, SkeletonCaseDetail } from '../../components/ui';
import type { CaseRecord, Prescription } from '../../types/case';

export function EmployeeCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((s) => s.auth.user);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null | undefined>(
    undefined,
  );
  const [submitNotes, setSubmitNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [productionRefresh, setProductionRefresh] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api.get<{ case: CaseRecord }>(`/api/employee/cases/${id}`);
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
  }, [id, load]);

  const isDesigner =
    user &&
    caseRecord &&
    caseRecord.designerId === user.id &&
    (user.employeeType === 'DESIGNER' || user.employeeType === 'BOTH');
  const isQc =
    user &&
    caseRecord &&
    caseRecord.qcId === user.id &&
    (user.employeeType === 'QC' || user.employeeType === 'BOTH');

  const startDesign = async () => {
    if (!id) return;
    setActing(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/cases/${id}/transition`,
        { status: 'IN_DESIGN' },
      );
      setCaseRecord(data.case);
      toast.success('Design started');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start design');
    } finally {
      setActing(false);
    }
  };

  const submitToQc = async () => {
    if (!id) return;
    setActing(true);
    setError(null);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/designer/cases/${id}/submit-to-qc`,
        {
          notes:
            sanitizeText(submitNotes, { maxLength: MAX.notes, multiline: true }) ||
            undefined,
        },
      );
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed');
    } finally {
      setActing(false);
    }
  };

  const qcApprove = async () => {
    if (!id) return;
    setActing(true);
    try {
      const data = await api.post<{ case: CaseRecord }>(`/api/qc/cases/${id}/approve`, {});
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approve failed');
    } finally {
      setActing(false);
    }
  };

  const qcReject = async () => {
    if (!id) return;
    setActing(true);
    try {
      const data = await api.post<{ case: CaseRecord }>(
        `/api/qc/cases/${id}/reject`,
        {
          notes:
            sanitizeText(rejectNotes, { maxLength: MAX.notes, multiline: true }) ||
            undefined,
        },
      );
      setCaseRecord(data.case);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reject failed');
    } finally {
      setActing(false);
    }
  };

  const uploadProduction = async (files: File[]) => {
    if (!id) return;
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    await api.upload(`/api/cases/${id}/production/files`, formData);
    setProductionRefresh((n) => n + 1);
    toast.success('Production files uploaded');
  };

  if (loading) return <SkeletonCaseDetail sections={4} />;
  if (error || !caseRecord) {
    return <Alert variant="error">{error ?? 'Case not found'}</Alert>;
  }

  const back = getEmployeeHomePath(user?.employeeType ?? null);

  return (
    <div className="space-y-6">
      <Link to={back} className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {caseRecord.patient?.name ?? 'Case'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Client: {caseRecord.createdBy?.name ?? '—'}
          </p>
        </div>
        <StatusBadge status={caseRecord.status} />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isDesigner && caseRecord.status === 'ASSIGNED' && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-6">
          <h2 className="text-lg font-semibold text-sky-900">Designer actions</h2>
          <p className="mt-1 text-sm text-sky-800/90">
            This case is assigned to you. Start design when you are ready to work.
          </p>
          <Button
            type="button"
            loading={acting}
            loadingText="Starting…"
            onClick={startDesign}
            className="mt-3"
          >
            Start design
          </Button>
        </section>
      )}

      {isDesigner && caseRecord.status === 'IN_DESIGN' && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-6">
          <h2 className="text-lg font-semibold text-sky-900">Designer actions</h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Submission notes
            <textarea
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              rows={2}
              className={patientInputClass}
            />
          </label>
          <Button
            type="button"
            loading={acting}
            loadingText="Submitting…"
            onClick={submitToQc}
            className="mt-3"
          >
            Submit to QC
          </Button>
          <div className="mt-4">
            <FileUpload
              label="Upload production files"
              hint="Max 100MB each"
              onUpload={uploadProduction}
            />
          </div>
        </section>
      )}

      {isQc && caseRecord.status === 'PENDING_QC' && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-indigo-900">QC review</h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Rejection notes
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              className={patientInputClass}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              type="button"
              loading={acting}
              loadingText="Approving…"
              onClick={qcApprove}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              Approve for client
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={acting}
              loadingText="Rejecting…"
              onClick={qcReject}
            >
              Reject to designer
            </Button>
          </div>
        </section>
      )}

      {caseRecord.notes && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Case notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{caseRecord.notes}</p>
        </section>
      )}

      <CaseFilesSection caseId={caseRecord.id} canUpload={false} canDelete={false} />

      {prescription !== undefined && prescription && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Prescription</h2>
          <div className="mt-4">
            <PrescriptionForm initial={prescription} onSubmit={async () => {}} readOnly />
          </div>
        </section>
      )}

      <ProductionSection
        caseId={caseRecord.id}
        canAddUrl={!!isDesigner}
        refreshKey={productionRefresh}
      />

      <CommentsSection caseId={caseRecord.id} canPost showInternal />
    </div>
  );
}
