import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Field, Input } from '../../components/ui';
import AuthShell from './AuthShell';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created! Set up your player profile next.');
      navigate('/student/profile', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Student accounts only. The sports office creates admin accounts.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input required value={form.name} onChange={set('name')} placeholder="Ayesha Noor" autoComplete="name" />
        </Field>
        <Field label="College email">
          <Input type="email" required value={form.email} onChange={set('email')} placeholder="you@student.edu" autoComplete="email" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" hint="At least 6 characters">
            <Input type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
