import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { sportsApi, venuesApi, tournamentsApi } from '../../api';
import { PageHeader, Card, Field, Input, Select, Textarea, Spinner } from '../../components/ui';
import { toLocalInput } from '../../utils/format';

export default function ProposeTournament() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const isAdmin = user.role === 'admin';
  const { data, loading } = useAsync(async () => {
    const [sports, venues] = await Promise.all([sportsApi.listSports(), venuesApi.listVenues()]);
    return { sports, venues };
  });
  const today = toLocalInput(new Date(), false);
  const [form, setForm] = useState({ name: '', sportId: '', venueId: '', startDate: today, endDate: today, description: '' });

  if (loading || !data) return <Spinner />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'sportId' ? { venueId: '' } : {}) }));
  const venues = data.venues.filter((v) => !form.sportId || v.sportIds.includes(form.sportId));

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form, startDate: `${form.startDate}T09:00`, endDate: `${form.endDate}T17:00` };
    const { ok, result } = await run(() => tournamentsApi.proposeTournament(payload), isAdmin ? 'Tournament created' : 'Proposal sent to the sports office');
    if (ok) navigate(`${isAdmin ? '/admin' : '/student'}/tournaments/${result.id}`);
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Create a tournament' : 'Propose a tournament'}
        subtitle={isAdmin ? 'Tournaments created by the sports office open for registration straight away.' : 'The sports office reviews proposals before registration opens.'}
      />
      <Card className="max-w-3xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Tournament name" className="sm:col-span-2">
            <Input required value={form.name} onChange={set('name')} placeholder="e.g. Spring Basketball Showdown" />
          </Field>
          <Field label="Sport">
            <Select required value={form.sportId} onChange={set('sportId')} placeholder="Choose a sport" options={data.sports.map((s) => ({ value: s.id, label: s.name }))} />
          </Field>
          <Field label="Venue">
            <Select
              required
              value={form.venueId}
              onChange={set('venueId')}
              placeholder={form.sportId ? 'Choose a venue' : 'Pick a sport first'}
              disabled={!form.sportId}
              options={venues.map((v) => ({ value: v.id, label: v.available ? v.name : `${v.name} (currently unavailable)` }))}
            />
          </Field>
          <Field label="Start date">
            <Input type="date" required min={today} value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date">
            <Input type="date" required min={form.startDate} value={form.endDate} onChange={set('endDate')} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={set('description')} placeholder="Format, rules, prizes…" />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{isAdmin ? 'Create tournament' : 'Submit proposal'}</button>
          </div>
        </form>
      </Card>
    </>
  );
}
