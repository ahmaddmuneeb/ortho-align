import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { patientInputClass } from '../components/PatientForm';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import { api, ApiError } from '../lib/api';
import { toast } from '../lib/toast';
import type { AuthUser, Gender } from '../types/auth';
import type { ProfileMePatch, UserProfile } from '../types/user';

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

function roleLabel(role: AuthUser['role']): string {
  switch (role) {
    case 'CLIENT':
      return 'Client (Doctor)';
    case 'EMPLOYEE':
      return 'Employee';
    case 'ADMIN':
      return 'Administrator';
    case 'PATIENT':
      return 'Patient';
    default:
      return role;
  }
}

export function ProfilePage() {
  const authUser = useAppSelector((s) => s.auth.user);
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
      const body: ProfileMePatch = { name: name.trim() };
      if (profile.role === 'CLIENT') {
        body.phone = phone.trim();
        body.website = website.trim() || undefined;
        body.businessAddress = businessAddress.trim();
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

  if (loading) {
    return <p className="text-muted">Loading profile…</p>;
  }

  if (error && !profile) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (!profile) {
    return null;
  }

  const isClient = profile.role === 'CLIENT';
  const canEditClientFields = isClient;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">My profile</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {authUser?.email ?? profile.email}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Edit profile
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-ink">Edit profile</h2>
          <p className="mt-1 text-xs text-muted">
            Email and role cannot be changed here. Contact an administrator if needed.
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={patientInputClass}
            />
          </label>

          {canEditClientFields && (
            <>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Phone
                <input
                  required
                  type="tel"
                  minLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={patientInputClass}
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Website (optional)
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={patientInputClass}
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Business address
                <input
                  required
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className={patientInputClass}
                />
              </label>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                resetForm(profile);
                setEditing(false);
                setError(null);
              }}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-brand-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-muted">Name</dt>
              <dd className="mt-1 text-sm text-ink">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted">Email</dt>
              <dd className="mt-1 text-sm text-ink">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted">Role</dt>
              <dd className="mt-1 text-sm text-ink">{roleLabel(profile.role)}</dd>
            </div>
            {profile.role === 'EMPLOYEE' && profile.employeeType && (
              <div>
                <dt className="text-xs font-medium uppercase text-muted">Employee type</dt>
                <dd className="mt-1 text-sm text-ink">{profile.employeeType}</dd>
              </div>
            )}
            {isClient && (
              <>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Gender</dt>
                  <dd className="mt-1 text-sm text-ink">
                    {GENDERS.find((g) => g.value === profile.gender)?.label ??
                      profile.gender ??
                      '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Region</dt>
                  <dd className="mt-1 text-sm text-ink">{profile.region ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Phone</dt>
                  <dd className="mt-1 text-sm text-ink">{profile.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Website</dt>
                  <dd className="mt-1 text-sm text-ink">
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
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-muted">Business address</dt>
                  <dd className="mt-1 text-sm text-ink">{profile.businessAddress ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-muted">How you heard about us</dt>
                  <dd className="mt-1 text-sm text-ink">{profile.hearAboutUs ?? '—'}</dd>
                </div>
              </>
            )}
          </dl>
          <p className="mt-6 text-xs text-muted">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
            {profile.updatedAt &&
              ` · Last updated ${new Date(profile.updatedAt).toLocaleDateString()}`}
          </p>
          {isClient && (
            <p className="mt-2 text-xs text-muted">
              Gender, region, and referral source were set at registration. Contact support to
              change them.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
