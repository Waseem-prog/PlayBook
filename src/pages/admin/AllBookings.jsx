import { useState } from 'react';
import { Trash2, MapPin } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { bookingsApi, venuesApi } from '../../api';
import { PageHeader, Card, Spinner, Table, FilterBar, Field, Select, Input, EmptyState, StatCard } from '../../components/ui';
import { ConfirmDialog } from '../../components/Modal';
import { todayStr } from '../../utils/format';

export default function AllBookings() {
  const { busy, run } = useAction();
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [cancelling, setCancelling] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [bookings, venues] = await Promise.all([bookingsApi.listAllBookings(), venuesApi.listVenues()]);
    return { bookings, venues };
  });

  if (loading && !data) return <Spinner />;
  const rows = data.bookings.filter((b) => (!venueId || b.venueId === venueId) && (!date || b.date === date));
  const today = data.bookings.filter((b) => b.date === todayStr());

  return (
    <>
      <PageHeader title="Court & field bookings" subtitle="Oversee every booking across venues. Cancel a booking if a venue is needed for an official match." />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.venues.map((v) => (
          <StatCard key={v.id} icon={MapPin} tone={v.available ? 'brand' : 'slate'} label={v.name} value={today.filter((b) => b.venueId === v.id).length} hint={v.available ? 'bookings today' : 'unavailable'} />
        ))}
      </div>
      <FilterBar>
        <Field label="Venue">
          <Select value={venueId} onChange={(e) => setVenueId(e.target.value)} placeholder="All venues" options={data.venues.map((v) => ({ value: v.id, label: v.name }))} />
        </Field>
        <Field label="Date" hint="Clear to see all dates">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </FilterBar>
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          empty={<EmptyState icon={MapPin} title="No bookings for this filter" />}
          columns={[
            { key: 'venue', label: 'Venue', render: (b) => <span className="font-medium">{b.venue.name}</span> },
            { key: 'date', label: 'Date', render: (b) => (b.date === todayStr() ? 'Today' : b.date) },
            { key: 'time', label: 'Time', render: (b) => `${b.startTime}–${b.endTime}` },
            { key: 'user', label: 'Booked by', render: (b) => <div><p>{b.user.name}</p><p className="text-xs text-slate-500">{b.user.email}</p></div> },
            { key: 'purpose', label: 'Purpose', render: (b) => b.purpose || <span className="text-slate-400">—</span> },
            { key: 'x', label: '', render: (b) => <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setCancelling(b)} aria-label="Cancel booking"><Trash2 className="h-4 w-4" /></button> },
          ]}
        />
      </Card>
      <ConfirmDialog
        open={!!cancelling}
        title="Cancel booking?"
        message={cancelling && `${cancelling.venue.name}, ${cancelling.startTime}–${cancelling.endTime}, booked by ${cancelling.user.name}.`}
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
