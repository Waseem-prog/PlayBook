import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Avatar } from './ui';

// Searchable list of students with checkboxes (multi) or single select.
export default function PlayerPicker({ players, selected = [], onToggle, sportId, exclude = [], max }) {
  const [q, setQ] = useState('');
  const [sportOnly, setSportOnly] = useState(!!sportId);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return players
      .filter((p) => !exclude.includes(p.id))
      .filter((p) => !sportOnly || !sportId || p.profile.sportIds.includes(sportId))
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.email.includes(s))
      .sort((a, b) => Number(b.profile.available) - Number(a.profile.available) || a.name.localeCompare(b.name));
  }, [players, q, sportOnly, sportId, exclude]);

  const full = max !== undefined && selected.length >= max;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {sportId && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600" checked={sportOnly} onChange={(e) => setSportOnly(e.target.checked)} />
            Plays this sport
          </label>
        )}
      </div>
      <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
        {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No players match</li>}
        {list.map((p) => {
          const on = selected.includes(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={!on && full}
                onClick={() => onToggle(p.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition disabled:opacity-40 ${on ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
              >
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.profile.position || 'No position set'} · {p.profile.skillLevel}
                    {p.profile.available && <span className="ml-1 text-emerald-600">· available</span>}
                  </p>
                </div>
                <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
