import { Outlet } from 'react-router-dom';
import { PortalHeader } from './PortalHeader';

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

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-surface px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
          OA
        </div>
        <h1 className="text-2xl font-semibold text-ink">OrthoAlign</h1>
        <p className="mt-1 text-sm text-muted">PAYG plan · Sign up from website</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
