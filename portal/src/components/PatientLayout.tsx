import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutAsync } from '../store/slices/authSlice';

const nav = [
  { to: '/patient/dashboard', label: 'Dashboard' },
  { to: '/patient/cases', label: 'My cases' },
  { to: '/patient/profile', label: 'Profile' },
];

export function PatientLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
              <p className="text-xs text-muted">Patient Portal</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/patient/dashboard'}
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
            <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
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
