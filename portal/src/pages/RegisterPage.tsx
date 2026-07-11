import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
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
import { COUNTRIES, REGION_LABELS, REGION_ORDER } from '../lib/countries';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register as registerThunk } from '../store/slices/authSlice';
import type { Gender } from '../types/auth';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const TITLES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'];

const HEAR_ABOUT_OPTIONS = ['Google', 'Email marketing', 'Colleague', 'Other'];

const STEP_LABELS = ['Personal Info', 'Contact details', 'Additional info'];

const LEGAL_LINKS = {
  terms: 'https://orthoalignsolution.com/terms-and-condition/',
  privacy: 'https://orthoalignsolution.com/privacy-policy/',
  businessAssociateAgreement: 'https://orthoalignsolution.com/business-associate-agreement/',
};

interface RegisterFormState {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  region: string;
  phone: string;
  businessAddress: string;
  hearAboutUs: string;
  hearAboutUsOther: string;
  website: string;
  agreedToTerms: boolean;
}

const INITIAL_FORM_STATE: RegisterFormState = {
  title: TITLES[0],
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  gender: '',
  region: '',
  phone: '',
  businessAddress: '',
  hearAboutUs: '',
  hearAboutUsOther: '',
  website: '',
  agreedToTerms: false,
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPassword = (value: string) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*]/.test(value);

function validateStep(step: number, s: RegisterFormState): string | null {
  if (step === 0) {
    if (!s.firstName.trim()) return 'First name is required';
    if (!s.lastName.trim()) return 'Last name is required';
    if (!isValidEmail(s.email)) return 'Enter a valid email address';
    if (!isValidPassword(s.password)) return 'Password does not meet the requirements below';
    return null;
  }
  if (step === 1) {
    if (!s.gender) return 'Select a gender';
    if (!s.region) return 'Select a region';
    if (!s.phone || !isValidPhoneNumber(s.phone)) return 'Enter a valid phone number';
    if (s.businessAddress.trim().length < 5) return 'Enter your full business address';
    return null;
  }
  if (s.hearAboutUs === '') return 'Select how you heard about us';
  if (s.hearAboutUs === 'Other' && !s.hearAboutUsOther.trim()) {
    return 'Please specify how you heard about us';
  }
  if (!s.agreedToTerms) {
    return 'You must agree to the Terms and Conditions, Privacy Policy, and Business Associate Agreement';
  }
  return null;
}

function Required() {
  return (
    <span className="text-red-600" aria-hidden="true">
      {' '}
      *
    </span>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-4 flex items-center">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-ink' : 'text-muted'}`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`mx-3 h-px flex-1 ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const { user, token, loading } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (!loading && user && token) {
      navigate(getRoleHomePath(user), { replace: true });
    }
  }, [loading, user, token, navigate]);

  const updateField = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const goNext = () => {
    const validationError = validateStep(step, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateStep(step, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await dispatch(
        registerThunk({
          email: sanitizeEmail(form.email),
          password: sanitizePassword(form.password),
          name: sanitizeText([form.title, form.firstName, form.lastName].join(' '), {
            maxLength: MAX.name,
          }),
          role: 'CLIENT',
          gender: form.gender as Gender,
          region: sanitizeText(form.region, { maxLength: MAX.region }),
          phone: sanitizePhone(form.phone),
          website: sanitizeUrl(form.website) || undefined,
          businessAddress: sanitizeText(form.businessAddress, { maxLength: MAX.address }),
          hearAboutUs: sanitizeText(
            form.hearAboutUs === 'Other' ? form.hearAboutUsOther : form.hearAboutUs,
            { maxLength: MAX.hearAboutUs },
          ),
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
    <AuthLayout maxWidthClassName="max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-ink">Create account</h2>
        <div className="mt-2">
          <Alert variant="info" title="Sign up form">
            Complete this short form to create an account for OrthoAlign and start submitting
            orders.
          </Alert>
        </div>

        <Stepper step={step} />

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Title
                  <Required />
                  <select
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    required
                    className={inputClass}
                  >
                    {TITLES.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  First name
                  <Required />
                  <input
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                  <Required />
                  <input
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Email
                <Required />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Password
                <Required />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
                <span className="mt-1 block text-xs text-muted">
                  8+ chars, uppercase, number, special (!@#$%^&*)
                </span>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Gender
                <Required />
                <select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Region
                <Required />
                <select
                  value={form.region}
                  onChange={(e) => updateField('region', e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select a country
                  </option>
                  {REGION_ORDER.map((region) => (
                    <optgroup key={region} label={REGION_LABELS[region]}>
                      {COUNTRIES.filter((c) => c.region === region).map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Phone
                <Required />
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={form.phone}
                  onChange={(value) => updateField('phone', value || '')}
                  aria-label="Phone number"
                />
                <span className="mt-1 block text-xs text-muted">
                  Include your country's area code
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Business address
                <Required />
                <input
                  value={form.businessAddress}
                  onChange={(e) => updateField('businessAddress', e.target.value)}
                  required
                  minLength={5}
                  maxLength={MAX.address}
                  title="Enter your full business address (5+ characters)"
                  className={inputClass}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                How did you hear about us?
                <Required />
                <select
                  value={form.hearAboutUs}
                  onChange={(e) => updateField('hearAboutUs', e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  {HEAR_ABOUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {form.hearAboutUs === 'Other' && (
                  <input
                    value={form.hearAboutUsOther}
                    onChange={(e) => updateField('hearAboutUsOther', e.target.value)}
                    required
                    placeholder="Please specify"
                    maxLength={MAX.hearAboutUs}
                    className={`${inputClass} mt-2`}
                  />
                )}
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Website (optional)
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-1 focus:ring-brand-500"
                />
                <span>
                  I have read and agree to the OrthoAlign{' '}
                  <a
                    href={LEGAL_LINKS.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Terms and Conditions
                  </a>
                  ,{' '}
                  <a
                    href={LEGAL_LINKS.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  , and{' '}
                  <a
                    href={LEGAL_LINKS.businessAssociateAgreement}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Business Associate Agreement
                  </a>
                  <Required />
                </span>
              </label>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={goBack} className="flex-1 py-2.5">
              Back
            </Button>
          )}
          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={goNext} className="flex-1 py-2.5">
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              loading={submitting}
              loadingText="Creating account…"
              className="flex-1 py-2.5"
            >
              Create account
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
