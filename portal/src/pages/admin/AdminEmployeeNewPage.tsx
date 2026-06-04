import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientInputClass } from '../../components/PatientForm';
import { api, ApiError } from '../../lib/api';
import { toast } from '../../lib/toast';

type EmployeeType = 'DESIGNER' | 'QC' | 'BOTH';

export function AdminEmployeeNewPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeType, setEmployeeType] = useState<EmployeeType>('DESIGNER');
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post<{
        user: { id: string; email: string; name: string };
        temporaryPassword?: string;
      }>('/api/users/employees', { email, password, name, employeeType });
      setTempPassword(data.temporaryPassword ?? password);
      toast.success('Employee created');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (tempPassword) {
    return (
      <div className="max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Employee created</h2>
        <p className="mt-2 text-sm text-emerald-800">
          Share this temporary password securely: <strong>{tempPassword}</strong>
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Back to users
        </button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/users" className="text-sm font-medium text-brand-700 hover:underline">
        ← Users
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Create employee</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-slate-700">
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
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={patientInputClass}
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Temporary password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={patientInputClass}
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Employee type
          <select
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value as EmployeeType)}
            className={patientInputClass}
          >
            <option value="DESIGNER">Designer</option>
            <option value="QC">QC</option>
            <option value="BOTH">Both</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create employee'}
        </button>
      </form>
    </div>
  );
}
