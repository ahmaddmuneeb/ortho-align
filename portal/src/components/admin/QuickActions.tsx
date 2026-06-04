import { Link } from 'react-router-dom';
import {
  List,
  Plus,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const actions: QuickAction[] = [
  {
    to: '/admin/cases/new',
    title: 'New case',
    description: 'Start a case for any client',
    icon: Plus,
  },
  {
    to: '/admin/patients/new',
    title: 'New patient',
    description: 'Register a patient record',
    icon: Users,
  },
  {
    to: '/admin/users/new',
    title: 'Add employee',
    description: 'Create designer or QC account',
    icon: UserPlus,
  },
  {
    to: '/admin/cases',
    title: 'View all cases',
    description: 'Search, filter, and manage workflow',
    icon: List,
  },
  {
    to: '/admin/users',
    title: 'Users',
    description: 'Clients, staff, and permissions',
    icon: Settings,
  },
];

export function QuickActions() {
  return (
    <section className="min-w-0">
      <h2 className="text-lg font-semibold text-ink">Quick actions</h2>
      <p className="mt-1 text-sm text-muted">Common admin tasks</p>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-brand-300 hover:shadow-md sm:gap-4 sm:p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-medium text-ink group-hover:text-brand-800"
                  title={action.title}
                >
                  {action.title}
                </p>
                <p
                  className="mt-0.5 break-words text-sm leading-snug text-muted"
                  title={action.description}
                >
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
