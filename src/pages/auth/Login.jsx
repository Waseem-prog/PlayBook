import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Field, Input } from '../../components/ui';
import AuthShell from './AuthShell';

const DEMO = {
  student: { email: 'ali@student.edu', password: 'student123' },
  admin: { email: 'admin@playbook.edu', password: 'admin123' },
};

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from && from.startsWith(homeFor(u)) ? from : homeFor(u), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Use your college email to continue.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@student.edu" />
        </Field>
        <Field label="Password">
          <Input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </Field>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" className="btn-secondary justify-start" onClick={() => setForm(DEMO.student)}>
            <GraduationCap className="h-4 w-4 text-brand-600" /> Student (Ali)
          </button>
          <button type="button" className="btn-secondary justify-start" onClick={() => setForm(DEMO.admin)}>
            <ShieldCheck className="h-4 w-4 text-indigo-600" /> Sports Office
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Fills in the form; then press Log in.</p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Create a student account
        </Link>
      </p>
    </AuthShell>
  );
}
