import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/Layout';
import { Alert, Button } from '../components/ui';
import { ApiError } from '../lib/api';
import { sanitizePassword } from '../lib/sanitize';
import { useAppDispatch } from '../store/hooks';
import { resetPassword } from '../store/slices/authSlice';

export function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedPassword = sanitizePassword(password);
    if (cleanedPassword !== sanitizePassword(confirmPassword)) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(resetPassword({ token, password: cleanedPassword })).unwrap();
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset. Sign in with your new password.' },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Reset password</h2>
        <p className="mt-1 text-sm text-muted">Choose a new password for your account</p>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {!token ? (
          <div className="mt-4">
            <Alert variant="error">
              This reset link is missing or invalid. Request a new one below.
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              New password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <span className="mt-1 block text-xs text-muted">
                8+ chars, uppercase, number, special (!@#$%^&*)
              </span>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Confirm new password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>

            <Button
              type="submit"
              loading={submitting}
              loadingText="Resetting…"
              className="mt-6 w-full py-2.5"
            >
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:underline">
            Request a new link
          </Link>
          {' · '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
