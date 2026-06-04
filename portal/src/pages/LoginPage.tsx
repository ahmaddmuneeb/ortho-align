import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/Layout';
import { Alert, Button } from '../components/ui';
import { ApiError } from '../lib/api';
import { sanitizeEmail, sanitizePassword } from '../lib/sanitize';
import { getRoleHomePath } from '../lib/routes';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginThunk } from '../store/slices/authSlice';

export function LoginPage() {
  const { user, token, loading } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && token) {
      navigate(getRoleHomePath(user), { replace: true });
    }
  }, [loading, user, token, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await dispatch(
        loginThunk({
          email: sanitizeEmail(email),
          password: sanitizePassword(password),
        }),
      ).unwrap();
      navigate(getRoleHomePath(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-ink">Sign in</h2>
        <p className="mt-1 text-sm text-muted">Access your OrthoAlign portal</p>

        {successMessage && (
          <div className="mt-4">
            <Alert variant="success">{successMessage}</Alert>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <Button
          type="submit"
          loading={submitting}
          loadingText="Signing in…"
          className="mt-6 w-full py-2.5"
        >
          Sign in
        </Button>

        <p className="mt-4 text-center text-sm text-muted">
          New practice?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Create account
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Patient portal? Your clinic creates your login — use the email they provided.
        </p>
      </form>
    </AuthLayout>
  );
}
