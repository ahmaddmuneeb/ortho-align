import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getEmployeeHomePath } from '../lib/routes';
import { toast } from '../lib/toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutAsync } from '../store/slices/authSlice';
import type { AuthUser } from '../types/auth';

type NavItem = { to: string; label: string };

function navForUser(user: AuthUser): NavItem[] {
  const profile: NavItem = { to: '/profile', label: 'Profile' };
  switch (user.role) {
    case 'CLIENT':
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/patients', label: 'Patients' },
        { to: '/cases', label: 'Cases' },
        profile,
      ];
    case 'ADMIN':
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/cases', label: 'Cases' },
        { to: '/admin/users', label: 'Users' },
        profile,
      ];
    case 'EMPLOYEE': {
      const home = getEmployeeHomePath(user.employeeType);
      const items: NavItem[] = [{ to: home, label: 'My queue' }];
      if (user.employeeType === 'BOTH') {
        items.push(
          { to: '/employee/designer', label: 'Designer' },
          { to: '/employee/qc', label: 'QC' },
        );
      }
      items.push(profile);
      return items;
    }
    default:
      return [profile];
  }
}

function portalSubtitle(role: AuthUser['role']): string {
  switch (role) {
    case 'CLIENT':
      return 'Doctor Portal';
    case 'ADMIN':
      return 'Admin Console';
    case 'EMPLOYEE':
      return 'Staff Portal';
    default:
      return 'Portal';
  }
}

export function PortalLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const nav = user ? navForUser(user) : [];

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              OA
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">OrthoAlign Solution</p>
              <p className="text-xs text-muted">{user ? portalSubtitle(user.role) : ''}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/dashboard'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/cases/new"
                className="hidden rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:inline-block"
              >
                New case
              </Link>
            )}
            <Link
              to="/profile"
              className="hidden text-sm text-muted hover:text-brand-700 sm:inline"
            >
              {user?.name}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand-500 hover:text-brand-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-surface px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          OA
        </div>
        <h1 className="text-2xl font-semibold text-ink">OrthoAlign Solution</h1>
        <p className="mt-1 text-sm text-muted">PAYG plan · Sign up from website</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
