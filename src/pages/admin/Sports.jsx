import { useState } from 'react';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { sportsApi, teamsApi } from '../../api';
import { PageHeader, Card, Spinner, Table, Field, Input, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';

const EMPTY = { name: '', minPlayers: 5, maxPlayers: 11 };

export default function Sports() {
  const { busy, run } = useAction();
  const [editing, setEditing] = useState(null); // null | 'new' | sport
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [sports, teams] = await Promise.all([sportsApi.listSports(), teamsApi.listTeams()]);
    return { sports, teams };
  });

  if (loading && !data) return <Spinner />;

  function open(sport) {
    setEditing(sport || 'new');
    setForm(sport ? { name: sport.name, minPlayers: sport.minPlayers, maxPlayers: sport.maxPlayers } : EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    const isNew = editing === 'new';
    const { ok } = await run(() => (isNew ? sportsApi.createSport(form) : sportsApi.updateSport(editing.id, form)), isNew ? 'Sport added' : 'Sport updated');
    if (ok) {
      setEditing(null);
      reload();
    }
  }

  const teamCount = (id) => data.teams.filter((t) => t.sportId === id).length;

  return (
    <>
      <PageHeader title="Sports & squad rules" subtitle="Add the sports students can form teams for, and set the min/max players per team." actions={<button className="btn-primary" onClick={() => open()}><Plus className="h-4 w-4" /> Add sport</button>} />
      <Card bodyClass="p-0">
        <Table
          rows={data.sports}
          empty={<EmptyState icon={Settings2} title="No sports yet" />}
          columns={[
            { key: 'name', label: 'Sport', render: (s) => <span className="font-medium">{s.name}</span> },
            { key: 'min', label: 'Min players', render: (s) => s.minPlayers },
            { key: 'max', label: 'Max players', render: (s) => s.maxPlayers },
            { key: 'teams', label: 'Teams', render: (s) => teamCount(s.id) },
            {
              key: 'actions',
              label: '',
              render: (s) => (
                <div className="flex justify-end gap-1">
                  <button className="btn-ghost p-1.5" onClick={() => open(s)} aria-label={`Edit ${s.name}`}><Pencil className="h-4 w-4" /></button>
                  <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add sport' : `Edit ${editing?.name}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="sport-form" disabled={busy}>Save</button>
          </>
        }
      >
        <form id="sport-form" onSubmit={save} className="space-y-4">
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Futsal" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min players">
              <Input type="number" min="1" required value={form.minPlayers} onChange={(e) => setForm({ ...form, minPlayers: e.target.value })} />
            </Field>
            <Field label="Max players">
              <Input type="number" min="1" required value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs text-slate-500">Teams below the minimum can't be approved; the maximum caps how many players a captain can add.</p>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        message="Sports that already have teams or tournaments can't be deleted."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => sportsApi.deleteSport(deleting.id), 'Sport deleted');
          setDeleting(null);
          if (ok) reload();
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
