import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { venuesApi, sportsApi } from '../../api';
import { PageHeader, Card, Spinner, Field, Input, Toggle, EmptyState, StatusBadge } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';

const EMPTY = { name: '', sportIds: [], available: true };

export default function Venues() {
  const { busy, run } = useAction();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [venues, sports] = await Promise.all([venuesApi.listVenues(), sportsApi.listSports()]);
    return { venues, sports };
  });

  if (loading && !data) return <Spinner />;
  const sportName = (id) => data.sports.find((s) => s.id === id)?.name;

  function open(v) {
    setEditing(v || 'new');
    setForm(v ? { name: v.name, sportIds: v.sportIds, available: v.available } : EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    const isNew = editing === 'new';
    const { ok } = await run(() => (isNew ? venuesApi.createVenue(form) : venuesApi.updateVenue(editing.id, form)), isNew ? 'Venue added' : 'Venue updated');
    if (ok) {
      setEditing(null);
      reload();
    }
  }

  const toggleAvailable = (v) => run(() => venuesApi.updateVenue(v.id, { available: !v.available }), `${v.name} marked ${v.available ? 'unavailable' : 'available'}`).then(reload);

  return (
    <>
      <PageHeader title="Venues" subtitle="Courts and fields students can book or use for matches. Mark a venue unavailable for maintenance." actions={<button className="btn-primary" onClick={() => open()}><Plus className="h-4 w-4" /> Add venue</button>} />

      {data.venues.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.venues.map((v) => (
            <Card key={v.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-500"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <StatusBadge status={v.available ? 'available' : 'unavailable'} label={v.available ? 'Available' : 'Unavailable'} />
                  </div>
                </div>
                <div className="flex">
                  <button className="btn-ghost p-1.5" onClick={() => open(v)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setDeleting(v)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {v.sportIds.length ? v.sportIds.map((id) => <span key={id} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{sportName(id)}</span>) : <span className="text-xs text-slate-400">No sports assigned</span>}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Toggle checked={v.available} onChange={() => toggleAvailable(v)} disabled={busy} label={v.available ? 'Open for bookings' : 'Closed'} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="card"><EmptyState icon={Building2} title="No venues yet" /></div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add venue' : `Edit ${editing?.name}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="venue-form" disabled={busy}>Save</button>
          </>
        }
      >
        <form id="venue-form" onSubmit={save} className="space-y-4">
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tennis Court 2" />
          </Field>
          <div>
            <span className="label">Sports hosted</span>
            <div className="flex flex-wrap gap-2">
              {data.sports.map((s) => {
                const on = form.sportIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm({ ...form, sportIds: on ? form.sportIds.filter((x) => x !== s.id) : [...form.sportIds, s.id] })}
                    className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600 hover:border-brand-400'}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          <Toggle checked={form.available} onChange={(v) => setForm({ ...form, available: v })} label="Available" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        message="Its bookings will be removed. Venues with upcoming matches or tournaments can't be deleted."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => venuesApi.deleteVenue(deleting.id), 'Venue deleted');
          setDeleting(null);
          if (ok) reload();
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
