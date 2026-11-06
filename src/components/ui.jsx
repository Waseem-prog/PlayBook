import { Loader2, Inbox } from 'lucide-react';
import { initials, labelOf } from '../utils/format';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const STATUS_STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  completed: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  returned: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  proposed: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  on_hold: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ongoing: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  active: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  unavailable: 'bg-slate-100 text-slate-500 ring-slate-400/20',
  admin: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  student: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

export function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {label || labelOf(status)}
    </span>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-medium text-rose-700">{error?.message || 'Could not load data'}</p>
      {onRetry && (
        <button className="btn-secondary mt-3" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export const Input = (props) => <input className="input" {...props} />;

export function Select({ options = [], placeholder, ...props }) {
  return (
    <select className="input" {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const Textarea = (props) => <textarea className="input min-h-[90px]" {...props} />;

const AVATAR_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500'];

export function Avatar({ name = '', size = 'md' }) {
  const color = AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const dims = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-sm';
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color} ${dims}`}>{initials(name) || '?'}</span>;
}

export function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="card flex items-center gap-4 p-4">
      {Icon && (
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="text-sm leading-snug text-slate-500">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
            value === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${value === t.value ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ children }) {
  return <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

export function Table({ columns, rows, rowKey = (r) => r.id, empty }) {
  if (!rows.length) return empty || <EmptyState title="Nothing here yet" />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </button>
  );
}
