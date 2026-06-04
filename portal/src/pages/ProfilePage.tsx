import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User,
} from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import { api, ApiError } from '../lib/api';
import {
  MAX,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
} from '../lib/sanitize';
import { toast } from '../lib/toast';
import { Alert, Button, SkeletonProfilePage } from '../components/ui';
import type { AuthUser, Gender } from '../types/auth';
import type { ProfileMePatch, UserProfile } from '../types/user';

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-sm';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

function profileToAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    employeeType: profile.employeeType,
    gender: profile.gender,
    region: profile.region,
    phone: profile.phone,
    website: profile.website,
    businessAddress: profile.businessAddress,
    hearAboutUs: profile.hearAboutUs,
  };
}

function roleBadgeLabel(role: AuthUser['role']): string {
  switch (role) {
    case 'CLIENT':
      return 'Client';
    case 'ADMIN':
      return 'Admin';
    case 'EMPLOYEE':
      return 'Staff';
    case 'PATIENT':
      return 'Patient';
    default:
      return role;
  }
}

function roleBadgeClass(role: AuthUser['role']): string {
  switch (role) {
    case 'CLIENT':
      return 'bg-sky-100 text-sky-800';
    case 'ADMIN':
      return 'bg-violet-100 text-violet-800';
    case 'EMPLOYEE':
      return 'bg-emerald-100 text-emerald-800';
    case 'PATIENT':
      return 'bg-brand-100 text-brand-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

function formatMemberDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function OverviewRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ReadOnlyChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback((p: UserProfile) => {
    setName(p.name);
    setPhone(p.phone ?? '');
    setWebsite(p.website ?? '');
    setBusinessAddress(p.businessAddress ?? '');
  }, []);

  const load = useCallback(async () => {
    const data = await api.get<{ user: UserProfile }>('/api/users/me');
    setProfile(data.user);
    resetForm(data.user);
  }, [resetForm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const body: ProfileMePatch = {
        name: sanitizeText(name, { maxLength: MAX.name }),
      };
      if (profile.role === 'CLIENT') {
        body.phone = sanitizePhone(phone);
        body.website = sanitizeUrl(website) || undefined;
        body.businessAddress = sanitizeText(businessAddress, { maxLength: MAX.address });
      }
      const data = await api.patch<{ user: UserProfile }>('/api/users/me', body);
      setProfile(data.user);
      resetForm(data.user);
      dispatch(setUser(profileToAuthUser(data.user)));
      setEditing(false);
      toast.success('Profile saved');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Save failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) resetForm(profile);
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return <SkeletonProfilePage />;
  }

  if (error && !profile) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!profile) {
    return null;
  }

  const isClient = profile.role === 'CLIENT';
  const genderLabel =
    GENDERS.find((g) => g.value === profile.gender)?.label ?? profile.gender ?? '—';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold text-ink">My profile</h1>
          </div>
          <div className="mt-2 ml-[52px] flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted">Manage your account details</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(profile.role)}`}
            >
              {roleBadgeLabel(profile.role)}
            </span>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        )}
      </header>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <aside className={`${cardClass} p-6`}>
          <h2 className="text-sm font-semibold text-ink">Account overview</h2>
          <div className="mt-6 flex flex-col items-center text-center sm:items-start sm:text-left">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white shadow-sm"
              aria-hidden
            >
              {initialsFromName(profile.name)}
            </div>
            <p className="mt-4 text-xl font-semibold text-ink">{profile.name}</p>
          </div>

          <div className="mt-6 space-y-4">
            <OverviewRow icon={<Mail className="h-4 w-4" />} label="Email">
              <span className="break-all">{profile.email}</span>
            </OverviewRow>
            <OverviewRow icon={<User className="h-4 w-4" />} label="Role">
              {roleBadgeLabel(profile.role)}
              {profile.role === 'EMPLOYEE' && profile.employeeType && (
                <span className="ml-1 text-muted">· {profile.employeeType}</span>
              )}
            </OverviewRow>
            <OverviewRow icon={<Building2 className="h-4 w-4" />} label="Member since">
              {formatMemberDate(profile.createdAt)}
            </OverviewRow>
          </div>

          {profile.updatedAt && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-muted">
              Last updated {formatMemberDate(profile.updatedAt)}
            </p>
          )}

          {isClient && !editing && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Practice details
              </p>
              <OverviewRow icon={<Phone className="h-4 w-4" />} label="Phone">
                {profile.phone ?? '—'}
              </OverviewRow>
              <OverviewRow icon={<Globe className="h-4 w-4" />} label="Website">
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    {profile.website}
                  </a>
                ) : (
                  '—'
                )}
              </OverviewRow>
              <OverviewRow icon={<MapPin className="h-4 w-4" />} label="Address">
                {profile.businessAddress ?? '—'}
              </OverviewRow>
            </div>
          )}
        </aside>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">
              {editing ? 'Edit profile' : 'Profile details'}
            </h2>
            {editing && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                Unsaved changes
              </span>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="mt-6">
              <FormSection title="Personal" icon={<User className="h-4 w-4" />}>
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                  />
                </label>
                {isClient && (
                  <label className="block text-sm font-medium text-slate-700">
                    Phone
                    <input
                      required
                      type="tel"
                      minLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </label>
                )}
              </FormSection>

              {isClient && (
                <FormSection title="Practice" icon={<Building2 className="h-4 w-4" />}>
                  <label className="block text-sm font-medium text-slate-700">
                    Website
                    <span className="ml-1 font-normal text-muted">(optional)</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={inputClass}
                      placeholder="https://"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Business address
                    <input
                      required
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className={inputClass}
                      autoComplete="street-address"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReadOnlyChip label="Gender" value={genderLabel} />
                    <ReadOnlyChip label="Region" value={profile.region ?? '—'} />
                  </div>
                  <ReadOnlyChip
                    label="How you heard about us"
                    value={profile.hearAboutUs ?? '—'}
                  />
                  <p className="text-xs text-muted">
                    Gender, region, and referral source were set at registration. Contact support
                    to change them.
                  </p>
                </FormSection>
              )}

              {!isClient && (
                <p className="mt-4 text-xs text-muted">
                  Email and role cannot be changed here. Contact an administrator if needed.
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <Button
                  type="submit"
                  loading={saving}
                  loadingText="Saving…"
                  className="inline-flex gap-2 rounded-lg"
                >
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={handleCancel}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 space-y-6">
              <FormSection title="Personal" icon={<User className="h-4 w-4" />}>
                <ReadOnlyChip label="Full name" value={profile.name} />
                {isClient && (
                  <ReadOnlyChip label="Phone" value={profile.phone ?? '—'} />
                )}
              </FormSection>

              {isClient && (
                <FormSection title="Practice" icon={<Building2 className="h-4 w-4" />}>
                  <ReadOnlyChip
                    label="Website"
                    value={profile.website ?? '—'}
                  />
                  <ReadOnlyChip
                    label="Business address"
                    value={profile.businessAddress ?? '—'}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReadOnlyChip label="Gender" value={genderLabel} />
                    <ReadOnlyChip label="Region" value={profile.region ?? '—'} />
                  </div>
                  <ReadOnlyChip
                    label="How you heard about us"
                    value={profile.hearAboutUs ?? '—'}
                  />
                </FormSection>
              )}

              {!isClient && (
                <p className="text-xs text-muted">
                  Use Edit profile to update your display name. Email and role are managed by your
                  administrator.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
