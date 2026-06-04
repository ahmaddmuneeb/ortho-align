import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import type { CaseRecord } from '../types/case';

interface CaseListProps {
  cases: CaseRecord[];
  detailPath: (id: string) => string;
  emptyMessage?: string;
}

export function CaseList({
  cases,
  detailPath,
  emptyMessage = 'No cases found.',
}: CaseListProps) {
  if (cases.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    to={detailPath(c.id)}
                    className="text-brand-700 hover:underline"
                  >
                    {c.patient?.name ?? c.patientId}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(c.updatedAt ?? c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              to={detailPath(c.id)}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-brand-700">
                  {c.patient?.name ?? 'Case'}
                </p>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                Updated {new Date(c.updatedAt ?? c.createdAt).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CaseListSkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}
