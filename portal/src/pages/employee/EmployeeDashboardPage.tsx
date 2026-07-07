import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Clock,
  FileWarning,
  History,
  ListChecks,
  Palette,
  RefreshCw,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { getEmployeeQueuePath } from '../../lib/routes';
import { useAppSelector } from '../../store/hooks';
import { StatCard } from '../../components/admin/StatCard';
import { Alert, SkeletonDashboard } from '../../components/ui';
import type { EmployeeDashboardStats } from '../../types/auth';

export function EmployeeDashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ stats: EmployeeDashboardStats }>('/api/employee/dashboard');
        if (!cancelled) setStats(data.stats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!stats) return null;

  const queuePath = getEmployeeQueuePath(user?.employeeType ?? null);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">My dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Overview of the cases assigned to you
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={queuePath}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            <ListChecks className="h-4 w-4" /> Go to queue
          </Link>
          <Link
            to="/employee/history"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <History className="h-4 w-4" /> Case history
          </Link>
        </div>
      </header>

      {stats.waitingForClarification > 0 && (
        <Alert variant="warning">
          {stats.waitingForClarification} case{stats.waitingForClarification === 1 ? '' : 's'}{' '}
          waiting on the doctor to resolve a clarification request.
        </Alert>
      )}

      <section aria-label="Case counts">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total assigned"
            value={stats.totalAssigned}
            icon={<ListChecks className="h-5 w-5" />}
            accent="brand"
          />
          <StatCard
            label="Pending (not started)"
            value={stats.pending}
            icon={<Clock className="h-5 w-5" />}
            accent="amber"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon={<Palette className="h-5 w-5" />}
            accent="sky"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="emerald"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Waiting for clarification"
            value={stats.waitingForClarification}
            icon={<FileWarning className="h-5 w-5" />}
            accent="amber"
          />
          <StatCard
            label="Declined by doctor"
            value={stats.declined}
            icon={<BadgeCheck className="h-5 w-5" />}
            accent="violet"
          />
          <StatCard
            label="Revision cases"
            value={stats.revisionCases}
            icon={<RefreshCw className="h-5 w-5" />}
            accent="slate"
          />
          <StatCard
            label="Completed revisions"
            value={stats.completedRevisions}
            icon={<RefreshCw className="h-5 w-5" />}
            accent="emerald"
          />
        </div>

        {stats.avgCompletionDays != null && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Avg. completion time (days)"
              value={stats.avgCompletionDays}
              icon={<Timer className="h-5 w-5" />}
              accent="brand"
            />
          </div>
        )}
      </section>
    </div>
  );
}
