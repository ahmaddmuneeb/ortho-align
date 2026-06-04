import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientInputClass } from '../../components/PatientForm';
import { api, ApiError } from '../../lib/api';
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
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">All portal accounts</p>
        </div>
        <Link
          to="/admin/users/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Create employee
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex min-w-[10rem] flex-1 flex-col text-sm font-medium text-slate-700 sm:max-w-xs">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email…"
            className={patientInputClass}
          />
        </label>
        <label className="flex min-w-[10rem] flex-col text-sm font-medium text-slate-700 sm:max-w-[12rem]">
          Role
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as '' | UserRole)}
            className={patientInputClass}
          >
            {ROLES.map((r) => (
              <option key={r.value || 'all'} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="mt-6 text-muted">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              {users.length === 0 ? 'No users.' : 'No users match your search.'}
            </p>
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
                  {filtered.map((u) => (
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
                {filtered.map((u) => (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
