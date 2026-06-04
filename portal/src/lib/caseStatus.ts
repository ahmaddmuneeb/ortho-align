import type { CaseStatus } from '../types/case';

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PENDING_APPROVAL: 'Pending approval',
  OPENED: 'Opened',
  ASSIGNED: 'Assigned',
  IN_DESIGN: 'In design',
  PENDING_QC: 'Pending QC',
  QC_REJECTED: 'QC rejected',
  PENDING_CLIENT_REVIEW: 'Awaiting your review',
  CLIENT_REJECTED: 'Revision requested',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
};

export const CLIENT_STATUS_FILTERS: { value: '' | CaseStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING_PAYMENT', label: 'Pending payment' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'IN_DESIGN', label: 'In design' },
  { value: 'PENDING_QC', label: 'In QC' },
  { value: 'PENDING_CLIENT_REVIEW', label: 'Needs review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ADMIN_STATUS_FILTERS: { value: '' | CaseStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING_PAYMENT', label: 'Pending payment' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'OPENED', label: 'Opened' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_DESIGN', label: 'In design' },
  { value: 'PENDING_QC', label: 'Pending QC' },
  { value: 'PENDING_CLIENT_REVIEW', label: 'Client review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const EMPLOYEE_STATUS_FILTERS: { value: '' | CaseStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'IN_DESIGN', label: 'In design' },
  { value: 'PENDING_QC', label: 'Pending QC' },
  { value: 'PENDING_CLIENT_REVIEW', label: 'Client review' },
  { value: 'APPROVED', label: 'Approved' },
];

export function statusBadgeClass(status: CaseStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT':
    case 'PENDING_APPROVAL':
      return 'bg-amber-50 text-amber-800';
    case 'PENDING_CLIENT_REVIEW':
      return 'bg-violet-50 text-violet-800';
    case 'IN_DESIGN':
    case 'ASSIGNED':
    case 'OPENED':
      return 'bg-sky-50 text-sky-800';
    case 'PENDING_QC':
      return 'bg-indigo-50 text-indigo-800';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-800';
    case 'CLIENT_REJECTED':
    case 'QC_REJECTED':
      return 'bg-orange-50 text-orange-800';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-brand-50 text-brand-800';
  }
}
