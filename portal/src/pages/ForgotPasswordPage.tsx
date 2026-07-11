import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/Layout';
import { Alert, Button } from '../components/ui';
import { ApiError } from '../lib/api';
import { sanitizeEmail } from '../lib/sanitize';
import { useAppDispatch } from '../store/hooks';
import { forgotPassword } from '../store/slices/authSlice';

export function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await dispatch(forgotPassword(sanitizeEmail(email))).unwrap();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Forgot password</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {submitted ? (
          <div className="mt-4">
            <Alert variant="success">
              If an account exists for that email, a reset link has been sent.
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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

            <Button
              type="submit"
              loading={submitting}
              loadingText="Sending…"
              className="mt-6 w-full py-2.5"
            >
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
