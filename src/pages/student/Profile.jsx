import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { sportsApi } from '../../api';
import { PageHeader, Card, Field, Input, Select, Textarea, Toggle, Avatar, Spinner, StatusBadge } from '../../components/ui';

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { data: sports, loading } = useAsync(() => sportsApi.listSports());
  const { busy, run } = useAction();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, ...user.profile });
  }, [user]);

  if (loading || !form) return <Spinner />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSport = (id) => set('sportIds', form.sportIds.includes(id) ? form.sportIds.filter((s) => s !== id) : [...form.sportIds, id]);

  function save(e) {
    e.preventDefault();
    const { name, ...profile } = form;
    run(() => updateProfile({ name, profile }), 'Profile saved');
  }

  return (
    <>
      <PageHeader title="My player profile" subtitle="Captains use this to find teammates. Mark yourself available to show up in player search." />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={form.name} size="lg" />
            <p className="mt-3 text-lg font-semibold">{form.name || 'Your name'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <StatusBadge status={form.available ? 'available' : 'unavailable'} label={form.available ? 'Available to play' : 'Not available'} />
              {form.skillLevel && <StatusBadge status="student" label={form.skillLevel} />}
            </div>
            {form.position && <p className="mt-3 text-sm text-slate-600">Plays as <b>{form.position}</b></p>}
            {form.bio && <p className="mt-2 text-sm italic text-slate-500">“{form.bio}”</p>}
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <Toggle checked={form.available} onChange={(v) => set('available', v)} label="I'm available for teams" />
            <p className="mt-2 text-xs text-slate-500">When on, you appear in “Find Players” for the sports you pick.</p>
          </div>
        </Card>

        <Card title="Details" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Skill level">
              <Select value={form.skillLevel} onChange={(e) => set('skillLevel', e.target.value)} options={SKILL_LEVELS.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Preferred position" className="sm:col-span-2">
              <Input value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Striker, Point Guard, All-rounder" />
            </Field>
            <Field label="Short bio" className="sm:col-span-2">
              <Textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={200} placeholder="What do you play, and when are you free?" />
            </Field>
          </div>
          <div className="mt-4">
            <span className="label">Sports I play</span>
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => {
                const on = form.sportIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSport(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" disabled={busy}>Save profile</button>
          </div>
        </Card>
      </form>
    </>
  );
}
