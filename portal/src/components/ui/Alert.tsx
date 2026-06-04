import type { ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; title: string }
> = {
  info: {
    container: 'border-slate-200 bg-slate-50 text-slate-800',
    icon: 'text-brand-600',
    title: 'text-ink',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    icon: 'text-emerald-600',
    title: 'text-emerald-950',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/80 text-amber-950',
    icon: 'text-amber-600',
    title: 'text-amber-950',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-600',
    title: 'text-red-950',
  },
};

const icons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const styles = variantStyles[variant];
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${styles.container} ${className}`.trim()}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && (
          <p className={`font-semibold ${styles.title}`}>{title}</p>
        )}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 shrink-0 rounded p-1 text-slate-500 hover:bg-black/5 hover:text-slate-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
