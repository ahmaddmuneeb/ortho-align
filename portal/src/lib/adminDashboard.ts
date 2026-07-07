import type { AdminUser, CaseRecord, CaseStatus } from '../types/case';

export interface AdminDashboardStats {
  totalCases: number;
  totalPatients: number;
  totalClients: number;
  totalEmployees: number;
  pendingPayment: number;
  inDesign: number;
  awaitingClientApproval: number;
  completedThisMonth: number;
  pendingApproval: number;
  statusBreakdown: { status: CaseStatus; count: number; label: string }[];
  casesLast7Days: { date: string; label: string; count: number }[];
}

const IN_DESIGN_STATUSES: CaseStatus[] = ['OPENED', 'ASSIGNED', 'IN_DESIGN'];

const STATUS_CHART_ORDER: CaseStatus[] = [
  'PENDING_PAYMENT',
  'PENDING_APPROVAL',
  'OPENED',
  'ASSIGNED',
  'CLARIFICATION_REQUESTED',
  'IN_DESIGN',
  'PENDING_QC',
  'QC_REJECTED',
  'PENDING_CLIENT_REVIEW',
  'CLIENT_REJECTED',
  'APPROVED',
  'CANCELLED',
];

const STATUS_CHART_LABELS: Record<CaseStatus, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PENDING_APPROVAL: 'Pending approval',
  OPENED: 'Opened',
  ASSIGNED: 'Assigned',
  CLARIFICATION_REQUESTED: 'Clarification requested',
  IN_DESIGN: 'In design',
  PENDING_QC: 'Pending QC',
  QC_REJECTED: 'QC rejected',
  PENDING_CLIENT_REVIEW: 'Client review',
  CLIENT_REJECTED: 'Declined',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
};

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeAdminStats(
  cases: CaseRecord[],
  patients: { id: string }[],
  users: AdminUser[],
): AdminDashboardStats {
  const monthStart = startOfMonth();

  const totalClients = users.filter((u) => u.role === 'CLIENT').length;
  const totalEmployees = users.filter((u) => u.role === 'EMPLOYEE').length;

  const pendingPayment = cases.filter((c) => c.status === 'PENDING_PAYMENT').length;
  const pendingApproval = cases.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const inDesign = cases.filter((c) => IN_DESIGN_STATUSES.includes(c.status)).length;
  const awaitingClientApproval = cases.filter(
    (c) => c.status === 'PENDING_CLIENT_REVIEW',
  ).length;

  const completedThisMonth = cases.filter((c) => {
    if (c.status !== 'APPROVED') return false;
    const ts = new Date(c.updatedAt ?? c.createdAt);
    return ts >= monthStart;
  }).length;

  const statusCounts = new Map<CaseStatus, number>();
  for (const status of STATUS_CHART_ORDER) {
    statusCounts.set(status, 0);
  }
  for (const c of cases) {
    statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
  }

  const statusBreakdown = STATUS_CHART_ORDER.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
    label: STATUS_CHART_LABELS[status],
  })).filter((row) => row.count > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: AdminDashboardStats['casesLast7Days'] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: dayKey(d),
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      count: 0,
    });
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.date, i]));
  for (const c of cases) {
    const key = dayKey(new Date(c.createdAt));
    const idx = bucketIndex.get(key);
    if (idx !== undefined) buckets[idx].count += 1;
  }

  return {
    totalCases: cases.length,
    totalPatients: patients.length,
    totalClients,
    totalEmployees,
    pendingPayment,
    inDesign,
    awaitingClientApproval,
    completedThisMonth,
    pendingApproval,
    statusBreakdown,
    casesLast7Days: buckets,
  };
}

export function recentCases(cases: CaseRecord[], limit = 8): CaseRecord[] {
  return [...cases]
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    )
    .slice(0, limit);
}
