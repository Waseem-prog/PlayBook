import { useEffect, useState } from 'react';
import { useAsync, useAction } from '../hooks/useAsync';
import { venuesApi, matchesApi } from '../api';
import { Modal } from './Modal';
import { Field, Input, Select } from './ui';
import { toLocalInput } from '../utils/format';

function defaultTime() {
  const d = new Date(Date.now() + 2 * 86400000);
  d.setHours(15, 0, 0, 0);
  return toLocalInput(d);
}

// Schedule a match: my team (home) vs opponent (away).
export default function ChallengeModal({ open, homeTeam, awayTeam, onClose, onCreated }) {
  const { busy, run } = useAction();
  const { data: venues } = useAsync(() => venuesApi.listVenues());
  const [form, setForm] = useState({ venueId: '', dateTime: defaultTime() });

  const options = (venues || []).filter((v) => homeTeam && v.sportIds.includes(homeTeam.sportId));

  useEffect(() => {
    if (open) setForm({ venueId: options.find((v) => v.available)?.id || '', dateTime: defaultTime() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, venues]);

  async function submit() {
    const { ok, result } = await run(
      () => matchesApi.createMatch({ homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, ...form }),
      'Match request sent to the sports office'
    );
    if (ok) onCreated?.(result);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a match"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.venueId} onClick={submit}>Send challenge</button>
        </>
      }
    >
      {homeTeam && awayTeam && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 rounded-lg bg-slate-50 p-4 text-center">
            <p className="flex-1 font-semibold">{homeTeam.name}</p>
            <span className="text-sm font-bold text-slate-400">VS</span>
            <p className="flex-1 font-semibold">{awayTeam.name}</p>
          </div>
          <Field label="Date & time">
            <Input type="datetime-local" value={form.dateTime} min={toLocalInput(new Date())} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} />
          </Field>
          <Field label="Venue" hint="Only venues that host this sport are listed.">
            <Select
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              placeholder="Choose a venue"
              options={options.map((v) => ({ value: v.id, label: v.available ? v.name : `${v.name} (unavailable)`, disabled: !v.available }))}
            />
          </Field>
          <p className="text-xs text-slate-500">The sports office will review the request. Once approved it appears on the match calendar.</p>
        </div>
      )}
    </Modal>
  );
}
