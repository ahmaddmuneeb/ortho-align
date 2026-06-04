import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Eye,
} from 'lucide-react';

interface AlertItem {
  count: number;
  label: string;
  description: string;
  to: string;
  tone: 'amber' | 'violet' | 'sky';
  icon: typeof CreditCard;
}

interface AlertsPanelProps {
  pendingPayment: number;
  pendingApproval: number;
  awaitingClientApproval: number;
  loading?: boolean;
}

const toneStyles = {
  amber: {
    border: 'border-amber-200 bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-800',
    link: 'text-amber-800 hover:text-amber-900',
    icon: 'text-amber-600',
  },
  violet: {
    border: 'border-violet-200 bg-violet-50/60',
    badge: 'bg-violet-100 text-violet-800',
    link: 'text-violet-800 hover:text-violet-900',
    icon: 'text-violet-600',
  },
  sky: {
    border: 'border-sky-200 bg-sky-50/60',
    badge: 'bg-sky-100 text-sky-800',
    link: 'text-sky-800 hover:text-sky-900',
    icon: 'text-sky-600',
  },
};

export function AlertsPanel({
  pendingPayment,
  pendingApproval,
  awaitingClientApproval,
  loading = false,
}: AlertsPanelProps) {
  if (loading) {
    return (
      <section
        className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-busy="true"
      >
        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  const items: AlertItem[] = [
    {
      count: pendingPayment,
      label: 'Pending payment',
      description: 'Cases waiting for payment approval',
      to: '/admin/cases?status=PENDING_PAYMENT',
      tone: 'amber',
      icon: CreditCard,
    },
    {
      count: pendingApproval,
      label: 'Pending approval',
      description: 'Submitted cases awaiting admin sign-off',
      to: '/admin/cases?status=PENDING_APPROVAL',
      tone: 'amber',
      icon: AlertTriangle,
    },
    {
      count: awaitingClientApproval,
      label: 'Awaiting client review',
      description: 'Designs sent back to the client',
      to: '/admin/cases?status=PENDING_CLIENT_REVIEW',
      tone: 'violet',
      icon: Eye,
    },
  ];

  const attentionCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Needs attention</h2>
          <p className="mt-1 text-sm text-muted">Items that may need action today</p>
        </div>
        {attentionCount > 0 && (
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
            {attentionCount}
          </span>
        )}
      </div>

      {attentionCount === 0 ? (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          All clear — no cases need immediate attention.
        </p>
      ) : (
        <ul className="mt-4 space-y-3" role="list">
          {items
            .filter((item) => item.count > 0)
            .map((item) => {
              const styles = toneStyles[item.tone];
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm ${styles.border}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{item.label}</p>
                        <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${styles.badge}`}
                    >
                      {item.count}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
