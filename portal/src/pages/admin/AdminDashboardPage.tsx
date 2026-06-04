import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted">Manage cases, staff, and approvals</p>

      <div className="mt-6">
        <Link
          to="/admin/cases/new"
          className="inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New case
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/cases"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300"
        >
          <h2 className="font-semibold text-brand-700">Cases</h2>
          <p className="mt-2 text-sm text-muted">
            List, create, approve payments, assign staff, edit notes
          </p>
        </Link>
        <Link
          to="/admin/users"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300"
        >
          <h2 className="font-semibold text-brand-700">Users</h2>
          <p className="mt-2 text-sm text-muted">
            List, edit, and delete users; create employee accounts
          </p>
        </Link>
      </div>
    </div>
  );
}
