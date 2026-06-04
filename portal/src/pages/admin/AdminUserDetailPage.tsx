import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { patientInputClass } from '../../components/PatientForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUser as setAuthUser } from '../../store/slices/authSlice';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import type { AdminUser } from '../../types/case';
import type { EmployeeType, Gender, UserRole } from '../../types/auth';

const ROLES: UserRole[] = ['CLIENT', 'ADMIN', 'EMPLOYEE'];
const EMPLOYEE_TYPES: NonNullable<EmployeeType>[] = ['DESIGNER', 'QC', 'BOTH'];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [employeeType, setEmployeeType] = useState<EmployeeType>('DESIGNER');
  const [gender, setGender] = useState<Gender>('MALE');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const applyUserToForm = (u: AdminUser) => {
    setName(u.name);
    setRole(u.role as UserRole);
    setEmployeeType((u.employeeType as EmployeeType) ?? 'DESIGNER');
    setGender((u.gender as Gender) ?? 'MALE');
    setRegion(u.region ?? '');
    setPhone(u.phone ?? '');
    setWebsite(u.website ?? '');
    setBusinessAddress(u.businessAddress ?? '');
    setHearAboutUs(u.hearAboutUs ?? '');
  };

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api.get<{ user: AdminUser }>(`/api/users/${id}`);
    setUser(data.user);
    applyUserToForm(data.user);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load user');
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
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        role,
      };
      if (role === 'EMPLOYEE') {
        body.employeeType = employeeType;
      }
      if (role === 'CLIENT') {
        body.gender = gender;
        body.region = region.trim() || null;
        body.phone = phone.trim();
        body.website = website.trim() || null;
        body.businessAddress = businessAddress.trim();
        body.hearAboutUs = hearAboutUs.trim() || null;
      }
      const data = await api.patch<{ user: AdminUser }>(`/api/users/${id}`, body);
      setUser(data.user);
      applyUserToForm(data.user);
      if (currentUser?.id === data.user.id) {
        dispatch(
          setAuthUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role as UserRole,
            employeeType: (data.user.employeeType as EmployeeType) ?? null,
            gender: data.user.gender as Gender | null | undefined,
            region: data.user.region,
            phone: data.user.phone,
            website: data.user.website,
            businessAddress: data.user.businessAddress,
            hearAboutUs: data.user.hearAboutUs,
          }),
        );
      }
      toast.success('User updated');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Update failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-muted">Loading user…</p>;
  }

  if (error && !user) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (!user) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        User not found
      </p>
    );
  }

  const isSelf = currentUser?.id === user.id;
  const showClientFields = role === 'CLIENT';

  return (
    <div>
      <Link to="/admin/users" className="text-sm font-medium text-brand-700 hover:underline">
        ← Users
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">
            Joined {new Date(user.createdAt).toLocaleDateString()}
            {user.updatedAt && ` · Updated ${new Date(user.updatedAt).toLocaleDateString()}`}
          </p>
        </div>
        {isSelf && (
          <Link
            to="/profile"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-brand-700 hover:border-brand-500"
          >
            My profile
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSave}
        className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-ink">Edit user</h2>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={patientInputClass}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Email
          <input
            readOnly
            value={user.email}
            className={`${patientInputClass} bg-slate-50 text-muted`}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={patientInputClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {role === 'EMPLOYEE' && (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Employee type
            <select
              value={employeeType ?? 'DESIGNER'}
              onChange={(e) => setEmployeeType(e.target.value as EmployeeType)}
              className={patientInputClass}
            >
              {EMPLOYEE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}

        {showClientFields && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-ink">Practice / client details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Gender
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={patientInputClass}
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Region
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={patientInputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
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
              <label className="block text-sm font-medium text-slate-700">
                Website (optional)
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={patientInputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Business address
                <input
                  required
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className={patientInputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                How they heard about us
                <input
                  value={hearAboutUs}
                  onChange={(e) => setHearAboutUs(e.target.value)}
                  className={patientInputClass}
                />
              </label>
            </div>
          </div>
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
            disabled={deleting || isSelf}
            onClick={handleDelete}
            title={isSelf ? 'Cannot delete your own account' : undefined}
            className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete user'}
          </button>
        </div>
        {isSelf && (
          <p className="mt-2 text-xs text-muted">
            You cannot delete your own admin account. Use Profile for personal edits limited to
            your role.
          </p>
        )}
      </form>
    </div>
  );
}
