import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { sportsApi, usersApi, teamsApi } from '../../api';
import { PageHeader, Card, Field, Input, Select, Spinner, Avatar } from '../../components/ui';
import PlayerPicker from '../../components/PlayerPicker';

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const { data, loading } = useAsync(async () => {
    const [sports, players] = await Promise.all([sportsApi.listSports(), usersApi.listStudents()]);
    return { sports, players };
  });
  const [form, setForm] = useState({ name: '', sportId: '' });
  const [memberIds, setMemberIds] = useState([]);

  if (loading || !data) return <Spinner />;

  const sport = data.sports.find((s) => s.id === form.sportId);
  const total = memberIds.length + 1; // + captain
  const toggle = (id) => setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  async function submit(e) {
    e.preventDefault();
    const { ok, result } = await run(() => teamsApi.createTeam({ ...form, memberIds }), 'Team submitted for approval');
    if (ok) navigate(`/student/teams/${result.id}`);
  }

  return (
    <>
      <PageHeader title="Build a squad" subtitle="Pick a sport, name your team and add teammates. You'll be the captain." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Team details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Team name">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Thunder FC" />
              </Field>
              <Field label="Sport">
                <Select
                  required
                  value={form.sportId}
                  onChange={(e) => setForm({ ...form, sportId: e.target.value })}
                  placeholder="Choose a sport"
                  options={data.sports.map((s) => ({ value: s.id, label: `${s.name} (${s.minPlayers}–${s.maxPlayers} players)` }))}
                />
              </Field>
            </div>
          </Card>
          <Card title="Add teammates" actions={<span className="text-sm text-slate-500">{memberIds.length} selected</span>}>
            {sport ? (
              <PlayerPicker players={data.players} selected={memberIds} onToggle={toggle} sportId={sport.id} exclude={[user.id]} max={sport.maxPlayers - 1} />
            ) : (
              <p className="text-sm text-slate-500">Choose a sport first.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Squad summary">
            <p className="text-sm text-slate-600">
              <b className="text-2xl text-slate-900">{total}</b>
              {sport && <span> / {sport.maxPlayers} max</span>} players
            </p>
            {sport && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${total >= sport.minPlayers ? 'bg-brand-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (total / sport.maxPlayers) * 100)}%` }} />
              </div>
            )}
            {sport && total < sport.minPlayers && (
              <p className="mt-2 text-xs text-amber-700">
                {sport.name} needs at least {sport.minPlayers} players to be approved. You can still submit and add more later.
              </p>
            )}
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Avatar name={user.name} size="sm" /> {user.name} <span className="text-xs text-amber-600">Captain</span>
              </li>
              {memberIds.map((id) => {
                const p = data.players.find((x) => x.id === id);
                return (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    <Avatar name={p.name} size="sm" /> {p.name}
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> New teams are reviewed by the sports office before they can play matches or enter tournaments.
          </div>
          <button className="btn-primary w-full" disabled={busy || !form.name || !form.sportId}>Submit for approval</button>
        </div>
      </form>
    </>
  );
}
