import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CreditCard,
  FileText,
  Palette,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { computeAdminStats, recentCases } from '../../lib/adminDashboard';
import { toast } from '../../lib/toast';
import { AlertsPanel } from '../../components/admin/AlertsPanel';
import { DashboardCharts } from '../../components/admin/DashboardCharts';
import { QuickActions } from '../../components/admin/QuickActions';
import { RecentCasesTable } from '../../components/admin/RecentCasesTable';
import { StatCard } from '../../components/admin/StatCard';
import type { AdminUser, CaseRecord } from '../../types/case';
import type { Patient, PatientsListResponse } from '../../types/patient';

export function AdminDashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [casesRes, patientsRes, usersRes] = await Promise.all([
          api.get<{ cases: CaseRecord[] }>('/api/cases'),
          api.get<PatientsListResponse>('/api/patients'),
          api.get<{ users: AdminUser[] }>('/api/users'),
        ]);

        if (cancelled) return;

        setCases(casesRes.cases ?? []);
        setPatients(patientsRes.patients ?? []);
        setUsers(usersRes.users ?? []);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to load dashboard';
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => (loading ? null : computeAdminStats(cases, patients, users)),
    [cases, patients, users, loading],
  );

  const latestCases = useMemo(
    () => (loading ? [] : recentCases(cases, 8)),
    [cases, loading],
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Practice-wide overview — cases, patients, and team activity
        </p>
      </header>

      <section aria-label="Key metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total cases"
            value={stats?.totalCases ?? 0}
            icon={<FileText className="h-5 w-5" />}
            accent="brand"
            loading={loading}
          />
          <StatCard
            label="Patients"
            value={stats?.totalPatients ?? 0}
            icon={<Users className="h-5 w-5" />}
            accent="slate"
            loading={loading}
          />
          <StatCard
            label="Clients"
            value={stats?.totalClients ?? 0}
            icon={<UserCheck className="h-5 w-5" />}
            accent="sky"
            loading={loading}
          />
          <StatCard
            label="Employees"
            value={stats?.totalEmployees ?? 0}
            icon={<Briefcase className="h-5 w-5" />}
            accent="emerald"
            loading={loading}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending payment"
            value={stats?.pendingPayment ?? 0}
            icon={<CreditCard className="h-5 w-5" />}
            accent="amber"
            loading={loading}
          />
          <StatCard
            label="In design"
            value={stats?.inDesign ?? 0}
            icon={<Palette className="h-5 w-5" />}
            accent="sky"
            loading={loading}
          />
          <StatCard
            label="Awaiting client approval"
            value={stats?.awaitingClientApproval ?? 0}
            icon={<BadgeCheck className="h-5 w-5" />}
            accent="violet"
            loading={loading}
          />
          <StatCard
            label="Completed this month"
            value={stats?.completedThisMonth ?? 0}
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="emerald"
            loading={loading}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-6">
          <DashboardCharts
            statusBreakdown={stats?.statusBreakdown ?? []}
            casesLast7Days={stats?.casesLast7Days ?? []}
            loading={loading}
          />
          <RecentCasesTable cases={latestCases} loading={loading} />
        </div>

        <aside className="min-w-0 space-y-6 xl:min-w-[320px]">
          <AlertsPanel
            pendingPayment={stats?.pendingPayment ?? 0}
            pendingApproval={stats?.pendingApproval ?? 0}
            awaitingClientApproval={stats?.awaitingClientApproval ?? 0}
            loading={loading}
          />
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}
