import { useEffect, useMemo, useState } from 'react';
import { MapPin, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { venuesApi, bookingsApi, sportsApi } from '../../api';
import { PageHeader, Card, Spinner, Field, Select, Input, StatusBadge, EmptyState } from '../../components/ui';
import { ConfirmDialog } from '../../components/Modal';
import { OPEN_TIME, CLOSE_TIME, timeSlots, toMinutes, todayStr, fmtDate } from '../../utils/format';

const OPEN = toMinutes(OPEN_TIME);
const SPAN = toMinutes(CLOSE_TIME) - OPEN;

// Horizontal 9-5 strip showing booked blocks for one venue.
function DayStrip({ bookings, userId, draft }) {
  const pos = (b) => ({ left: `${((toMinutes(b.startTime) - OPEN) / SPAN) * 100}%`, width: `${((toMinutes(b.endTime) - toMinutes(b.startTime)) / SPAN) * 100}%` });
  const hours = [];
  for (let h = 9; h <= 17; h++) hours.push(h);
  return (
    <div>
      <div className="relative h-10 overflow-hidden rounded-lg bg-slate-100">
        {hours.slice(1, -1).map((h) => (
          <div key={h} className="absolute inset-y-0 border-l border-white" style={{ left: `${((h * 60 - OPEN) / SPAN) * 100}%` }} />
        ))}
        {bookings.map((b) => (
          <div
            key={b.id}
            className={`absolute inset-y-1 flex items-center overflow-hidden rounded-md px-1.5 text-[11px] font-medium text-white ${b.userId === userId ? 'bg-brand-600' : 'bg-slate-500'}`}
            style={pos(b)}
            title={`${b.startTime}–${b.endTime} · ${b.user.name}${b.purpose ? ` · ${b.purpose}` : ''}`}
          >
            <span className="truncate">{b.startTime}</span>
          </div>
        ))}
        {draft && toMinutes(draft.endTime) > toMinutes(draft.startTime) && (
          <div className="absolute inset-y-1 rounded-md border-2 border-dashed border-brand-500 bg-brand-500/15" style={pos(draft)} />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {hours.map((h) => (
          <span key={h}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</span>
        ))}
      </div>
    </div>
  );
}

export default function BookVenue() {
  const { user } = useAuth();
  const { busy, run } = useAction();
  const [form, setForm] = useState({ venueId: '', startTime: '10:00', endTime: '11:00', purpose: '' });
  const [cancelling, setCancelling] = useState(null);

  const { data, loading, reload } = useAsync(async () => {
    const [venues, sports, today, mine] = await Promise.all([venuesApi.listVenues(), sportsApi.listSports(), bookingsApi.listBookings({ date: todayStr() }), bookingsApi.listMyBookings()]);
    return { venues, sports, today, mine };
  });

  useEffect(() => {
    if (data && !form.venueId) setForm((f) => ({ ...f, venueId: data.venues.find((v) => v.available)?.id || '' }));
  }, [data, form.venueId]);

  const slots = useMemo(() => timeSlots(), []);
  if (loading && !data) return <Spinner />;

  const sportNames = (ids) => ids.map((id) => data.sports.find((s) => s.id === id)?.name).filter(Boolean).join(', ');
  const forVenue = (vid) => data.today.filter((b) => b.venueId === vid);
  const selected = data.venues.find((v) => v.id === form.venueId);

  async function submit(e) {
    e.preventDefault();
    const { ok } = await run(() => bookingsApi.createBooking(form), 'Venue booked!');
    if (ok) {
      setForm((f) => ({ ...f, purpose: '' }));
      reload();
    }
  }

  return (
    <>
      <PageHeader title="Book a court or field" subtitle={`Same-day bookings for practice or casual play · ${fmtDate(new Date().toISOString())} · open ${OPEN_TIME}–${CLOSE_TIME}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {data.venues.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={!v.available}
              onClick={() => setForm({ ...form, venueId: v.id })}
              className={`card block w-full p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${form.venueId === v.id ? 'border-brand-500 ring-2 ring-brand-500/20' : 'hover:border-slate-300'}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-slate-400" /> {v.name}</p>
                  <p className="text-xs text-slate-500">{sportNames(v.sportIds) || 'No sports assigned'}</p>
                </div>
                <StatusBadge status={v.available ? 'available' : 'unavailable'} label={v.available ? `${forVenue(v.id).length} booking(s) today` : 'Unavailable'} />
              </div>
              <DayStrip bookings={forVenue(v.id)} userId={user.id} draft={form.venueId === v.id ? form : null} />
            </button>
          ))}
          <p className="flex gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-600" /> Your booking</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-500" /> Booked</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded border-2 border-dashed border-brand-500" /> Your selection</span>
          </p>
        </div>

        <div className="space-y-6">
          <Card title="New booking">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Venue">
                <Select value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })} placeholder="Choose a venue" options={data.venues.map((v) => ({ value: v.id, label: v.name, disabled: !v.available }))} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  <Select value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} options={slots.slice(0, -1).map((s) => ({ value: s, label: s }))} />
                </Field>
                <Field label="To">
                  <Select value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} options={slots.slice(1).map((s) => ({ value: s, label: s }))} />
                </Field>
              </div>
              <Field label="Purpose (optional)">
                <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Team practice" />
              </Field>
              <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> Today only, max 2 hours, no overlapping bookings.</p>
              <button className="btn-primary w-full" disabled={busy || !selected}>Book {selected ? selected.name : 'venue'}</button>
            </form>
          </Card>

          <Card title="My bookings" bodyClass="divide-y divide-slate-100">
            {data.mine.length ? (
              data.mine.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.venue.name}</p>
                    <p className="text-xs text-slate-500">
                      {b.date === todayStr() ? 'Today' : b.date} · {b.startTime}–{b.endTime} {b.purpose && `· ${b.purpose}`}
                    </p>
                  </div>
                  {b.date === todayStr() && (
                    <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setCancelling(b)} aria-label="Cancel booking">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyState icon={MapPin} title="No bookings yet" />
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel booking?"
        message={cancelling && `${cancelling.venue.name}, ${cancelling.startTime}–${cancelling.endTime}`}
        confirmLabel="Cancel booking"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => bookingsApi.cancelBooking(cancelling.id), 'Booking cancelled');
          setCancelling(null);
          if (ok) reload();
        }}
        onClose={() => setCancelling(null)}
      />
    </>
  );
}
