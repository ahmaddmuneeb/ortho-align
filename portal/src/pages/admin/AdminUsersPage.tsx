import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { Alert } from '../../components/ui';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { patientInputClass } from '../../components/PatientForm';
import { api, ApiError } from '../../lib/api';
import { sanitizeSearchQuery } from '../../lib/sanitize';
import { usePagination } from '../../lib/usePagination';
import type { AdminUser } from '../../types/case';
import type { UserRole } from '../../types/auth';

const ROLES: { value: '' | UserRole; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ADMIN', label: 'Admin' },
];

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = roleFilter ? `?role=${encodeURIComponent(roleFilter)}` : '';
        const data = await api.get<{ users: AdminUser[] }>(`/api/users${qs}`);
        if (!cancelled) setUsers(data.users ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load users');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleFilter]);

  const filtered = useMemo(() => {
    const q = sanitizeSearchQuery(search).toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const {
    page,
    pageSize,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = usePagination(filtered, [search, roleFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">All portal accounts</p>
        </div>
        <Link
          to="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <UserPlus className="h-4 w-4" />
          Create employee
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex min-w-[10rem] flex-1 flex-col text-sm font-medium text-slate-700 sm:max-w-xs">
          Search
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email…"
              className={`${patientInputClass} pl-9`}
            />
          </div>
        </label>
        <label className="flex min-w-[10rem] flex-col text-sm font-medium text-slate-700 sm:max-w-[12rem]">
          Role
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as '' | UserRole)}
            className={`${patientInputClass} mt-1`}
          >
            {ROLES.map((r) => (
              <option key={r.value || 'all'} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <SkeletonTable rows={8} cols={4} className="mt-6" />}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-6 py-6">
              <Alert variant="info">
                {users.length === 0 ? 'No users.' : 'No users match your search.'}
              </Alert>
            </div>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {u.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3 text-muted">{u.employeeType ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-slate-100 md:hidden">
                {paginatedItems.map((u) => (
                  <li key={u.id} className="px-4 py-3">
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {u.email} · {u.role}
                      {u.employeeType ? ` · ${u.employeeType}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
