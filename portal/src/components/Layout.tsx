import { Outlet } from 'react-router-dom';
import { PortalHeader } from './PortalHeader';
import logo from '../assets/logo.png';

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <PortalHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout({
  children,
  subtitle = 'Sign up for the portal',
  maxWidthClassName = 'max-w-md',
}: {
  children: React.ReactNode;
  subtitle?: string;
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-surface px-4 py-12">
      <div className="mb-8 text-center">
        <img src={logo} alt="Ortho Align Solution" className="mx-auto h-20 w-auto" />
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>
      <div className={`w-full ${maxWidthClassName}`}>{children}</div>
    </div>
  );
}
