import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/Layout';
import { Alert, Button } from '../components/ui';
import { ApiError } from '../lib/api';
import {
  MAX,
  sanitizeEmail,
  sanitizePassword,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
} from '../lib/sanitize';
import { getRoleHomePath } from '../lib/routes';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register as registerThunk } from '../store/slices/authSlice';
import type { Gender } from '../types/auth';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export function RegisterPage() {
  const { user, token, loading } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && token) {
      navigate(getRoleHomePath(user), { replace: true });
    }
  }, [loading, user, token, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await dispatch(
        registerThunk({
          email: sanitizeEmail(String(form.get('email'))),
          password: sanitizePassword(String(form.get('password'))),
          name: sanitizeText(String(form.get('name')), { maxLength: MAX.name }),
          role: 'CLIENT',
          gender: form.get('gender') as Gender,
          region: sanitizeText(String(form.get('region')), { maxLength: MAX.region }),
          phone: sanitizePhone(String(form.get('phone'))),
          website: sanitizeUrl(String(form.get('website') || '')) || undefined,
          businessAddress: sanitizeText(String(form.get('businessAddress')), {
            maxLength: MAX.address,
          }),
          hearAboutUs: sanitizeText(String(form.get('hearAboutUs')), {
            maxLength: MAX.hearAboutUs,
          }),
        }),
      ).unwrap();
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Please sign in.' },
      });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const details = Array.isArray(err.details)
          ? err.details.join(' ')
          : String(err.details);
        setError(`${err.message}: ${details}`);
      } else {
        setError(err instanceof ApiError ? err.message : 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-ink">Create practice account</h2>
        <p className="mt-1 text-sm text-muted">
          OrthoAlign PAYG · CLIENT registration (doctors)
        </p>
        <div className="mt-2">
          <Alert variant="info">
            Patient portal logins are created by your clinic administrator, not on this page.
          </Alert>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Full name
            <input name="name" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-muted">
              8+ chars, uppercase, number, special (!@#$%^&*)
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Gender
            <select name="gender" required className={inputClass}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Region
            <input name="region" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input name="phone" type="tel" required minLength={10} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Website (optional)
            <input name="website" type="url" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Business address
            <input name="businessAddress" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            How did you hear about us?
            <input name="hearAboutUs" required className={inputClass} />
          </label>
        </div>

        <Button
          type="submit"
          loading={submitting}
          loadingText="Creating account…"
          className="mt-6 w-full py-2.5"
        >
          Create account
        </Button>

        <p className="mt-4 text-center text-sm text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
