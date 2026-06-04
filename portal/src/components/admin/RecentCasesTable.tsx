import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { SkeletonTable } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { formatDisplayDate } from '../../lib/patientDates';
import type { CaseRecord } from '../../types/case';

interface RecentCasesTableProps {
  cases: CaseRecord[];
  loading?: boolean;
}

export function RecentCasesTable({ cases, loading = false }: RecentCasesTableProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
          <p className="mt-0.5 text-sm text-muted">Latest case updates</p>
        </div>
        <Link
          to="/admin/cases"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          View all cases
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={4} className="border-0 shadow-none" />
      ) : cases.length === 0 ? (
        <div className="px-6 py-6">
          <Alert variant="info" title="No cases yet">
            <Link to="/admin/cases/new" className="font-medium text-brand-700 hover:underline">
              Create the first case
            </Link>
          </Alert>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-3 font-medium">
                      <Link
                        to={`/admin/cases/${c.id}`}
                        className="text-brand-700 hover:underline"
                      >
                        {c.patient?.name ?? c.patientId}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {c.createdBy?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDisplayDate(c.updatedAt ?? c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/cases/${c.id}`}
                  className="block px-4 py-4 hover:bg-slate-50/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-brand-700">
                      {c.patient?.name ?? 'Case'}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {c.createdBy?.name ?? 'Unknown client'} ·{' '}
                    {formatDisplayDate(c.updatedAt ?? c.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
