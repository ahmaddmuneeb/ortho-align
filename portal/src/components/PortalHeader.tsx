import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PenTool,
  Plus,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getEmployeeQueuePath } from '../lib/routes';
import { toast } from '../lib/toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutAsync } from '../store/slices/authSlice';
import type { AuthUser } from '../types/auth';
import { Button } from './ui';

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

function navForUser(user: AuthUser): NavItem[] {
  switch (user.role) {
    case 'CLIENT':
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/patients', label: 'Patients', icon: Users },
        { to: '/cases', label: 'Cases', icon: FolderOpen },
      ];
    case 'ADMIN':
      return [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/admin/patients', label: 'Patients', icon: Users },
        { to: '/admin/cases', label: 'Cases', icon: FolderOpen },
        { to: '/admin/users', label: 'Users', icon: UserCog },
      ];
    case 'EMPLOYEE': {
      const items: NavItem[] = [
        { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      ];
      if (user.employeeType === 'BOTH') {
        items.push(
          { to: '/employee/designer', label: 'Designer', icon: PenTool },
          { to: '/employee/qc', label: 'QC', icon: ClipboardCheck },
        );
      } else {
        items.push({
          to: getEmployeeQueuePath(user.employeeType),
          label: 'My queue',
          icon: ListChecks,
        });
      }
      if (user.employeeType === 'QC' || user.employeeType === 'BOTH') {
        items.push({ to: '/employee/qc-queue', label: 'Open QC queue', icon: ClipboardList });
      }
      items.push({ to: '/employee/history', label: 'History', icon: FolderOpen });
      return items;
    }
    case 'PATIENT':
      return [
        { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/patient/cases', label: 'My cases', icon: FolderOpen },
      ];
    default:
      return [];
  }
}

function roleBadgeLabel(user: AuthUser): string {
  switch (user.role) {
    case 'CLIENT':
      return 'Doctor';
    case 'ADMIN':
      return 'Admin';
    case 'EMPLOYEE':
      return user.employeeType === 'QC'
        ? 'QC Staff'
        : user.employeeType === 'DESIGNER'
          ? 'Designer'
          : 'Staff';
    case 'PATIENT':
      return 'Patient';
    default:
      return 'Portal';
  }
}

function profilePath(user: AuthUser): string {
  return user.role === 'PATIENT' ? '/patient/profile' : '/profile';
}

function newCasePath(user: AuthUser): string | null {
  if (user.role === 'ADMIN') return '/admin/cases/new';
  if (user.role === 'CLIENT') return '/cases/new';
  return null;
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayName(user: AuthUser): string {
  return user.name.trim() || 'Account';
}

export interface PortalHeaderProps {
  /** Override subtitle under brand (defaults from role) */
  subtitle?: string;
}

export function PortalHeader({ subtitle }: PortalHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const nav = user ? navForUser(user) : [];
  const newCaseTo = user ? newCasePath(user) : null;
  const profileTo = user ? profilePath(user) : '/profile';

  const openLogoutConfirm = () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    if (logoutLoading) return;
    setLogoutConfirmOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await dispatch(logoutAsync());
      toast.success('Signed out');
      setLogoutConfirmOpen(false);
      navigate('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLogoutConfirm();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [logoutConfirmOpen, logoutLoading]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={nav[0]?.to ?? '/'}
              className="flex shrink-0 items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm">
                OA
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-ink">OrthoAlign</p>
                <p className="truncate text-xs text-muted">
                  {subtitle ?? (user ? roleBadgeLabel(user) : 'Portal')}
                </p>
              </div>
            </Link>
            {user && (
              <span className="hidden rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800 lg:inline">
                {roleBadgeLabel(user)}
              </span>
            )}
          </div>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {newCaseTo && (
              <Link
                to={newCaseTo}
                className="hidden items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                New case
              </Link>
            )}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="portal-user-menu"
                  id="portal-user-menu-trigger"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
                    aria-hidden
                  >
                    {userInitials(user.name)}
                  </span>
                  <span className="max-w-[8rem] truncate font-medium">
                    {displayName(user)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {userMenuOpen && (
                  <div
                    id="portal-user-menu"
                    role="menu"
                    aria-labelledby="portal-user-menu-trigger"
                    className="absolute right-0 z-[60] mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <Link
                      to={profileTo}
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setMobileOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 shrink-0" aria-hidden />
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openLogoutConfirm}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-0.5" aria-label="Mobile">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={navLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </NavLink>
                );
              })}
              {newCaseTo && (
                <Link
                  to={newCaseTo}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  New case
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]"
            onClick={closeLogoutConfirm}
            aria-label="Close dialog"
            disabled={logoutLoading}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            className="relative w-full max-w-sm animate-[modal-in_180ms_ease-out] rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={closeLogoutConfirm}
              disabled={logoutLoading}
              aria-label="Close dialog"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <LogOut className="h-5 w-5" aria-hidden />
            </span>

            <h2 id="logout-dialog-title" className="mt-4 text-lg font-semibold text-ink">
              Sign out of OrthoAlign?
            </h2>
            <p id="logout-dialog-desc" className="mt-1.5 text-sm text-muted">
              You'll need to sign in again to access your account.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="secondary"
                disabled={logoutLoading}
                onClick={closeLogoutConfirm}
                className="sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={logoutLoading}
                loadingText="Signing out…"
                onClick={handleLogoutConfirm}
                className="!border-transparent !bg-red-600 !text-white hover:!bg-red-700 focus-visible:!ring-red-500 sm:flex-1"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
