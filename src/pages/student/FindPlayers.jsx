import { useState } from 'react';
import { UserSearch, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { usersApi, sportsApi, teamsApi } from '../../api';
import { PageHeader, FilterBar, Field, Input, Select, Toggle, Spinner, EmptyState, Avatar, StatusBadge } from '../../components/ui';
import { Modal } from '../../components/Modal';

export default function FindPlayers() {
  const { user } = useAuth();
  const { busy, run } = useAction();
  const [filters, setFilters] = useState({ sportId: '', search: '', availableOnly: true });
  const [inviting, setInviting] = useState(null);
  const [teamId, setTeamId] = useState('');

  const { data: meta, reload: reloadMeta } = useAsync(async () => {
    const [sports, teams] = await Promise.all([sportsApi.listSports(), teamsApi.listMyTeams()]);
    return { sports, myTeams: teams.filter((t) => t.captainId === user.id && t.status !== 'rejected') };
  });
  const { data: players, loading, reload } = useAsync(() => usersApi.listPlayers(filters), [filters.sportId, filters.search, filters.availableOnly]);

  const sportName = (id) => meta?.sports.find((s) => s.id === id)?.name;
  const eligibleTeams = (p) => (meta?.myTeams || []).filter((t) => !t.memberIds.includes(p.id));

  function openInvite(p) {
    setInviting(p);
    setTeamId(eligibleTeams(p)[0]?.id || '');
  }

  async function invite() {
    const { ok } = await run(() => teamsApi.addMember(teamId, inviting.id), `${inviting.name} added to the team`);
    if (ok) {
      setInviting(null);
      reloadMeta();
      reload();
    }
  }

  return (
    <>
      <PageHeader title="Find people to play with" subtitle="Browse players who marked themselves available, then add them to a team you captain." />
      <FilterBar>
        <Field label="Sport">
          <Select value={filters.sportId} onChange={(e) => setFilters({ ...filters, sportId: e.target.value })} placeholder="All sports" options={(meta?.sports || []).map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Search" className="lg:col-span-2">
          <Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or position" />
        </Field>
        <div className="flex items-end pb-1.5">
          <Toggle checked={filters.availableOnly} onChange={(v) => setFilters({ ...filters, availableOnly: v })} label="Available only" />
        </div>
      </FilterBar>

      {loading && !players ? (
        <Spinner />
      ) : players.filter((p) => p.id !== user.id).length === 0 ? (
        <div className="card"><EmptyState icon={UserSearch} title="No players found" message="Try another sport or turn off “Available only”." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {players
            .filter((p) => p.id !== user.id)
            .map((p) => (
              <div key={p.id} className="card flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.profile.position || 'No position set'}</p>
                  </div>
                  <StatusBadge status={p.profile.available ? 'available' : 'unavailable'} label={p.profile.available ? 'Available' : 'Busy'} />
                </div>
                {p.profile.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.profile.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{p.profile.skillLevel}</span>
                  {p.profile.sportIds.map((id) => (
                    <span key={id} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{sportName(id)}</span>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  <button className="btn-secondary btn-sm w-full" onClick={() => openInvite(p)} disabled={!eligibleTeams(p).length} title={!meta?.myTeams.length ? 'Create a team first' : ''}>
                    <UserPlus className="h-4 w-4" /> {meta?.myTeams.length ? (eligibleTeams(p).length ? 'Add to my team' : 'Already on your teams') : 'Captain a team to invite'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal
        open={!!inviting}
        onClose={() => setInviting(null)}
        title={`Add ${inviting?.name}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setInviting(null)}>Cancel</button>
            <button className="btn-primary" disabled={!teamId || busy} onClick={invite}>Add to team</button>
          </>
        }
      >
        {inviting && (
          <Field label="Team">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} options={eligibleTeams(inviting).map((t) => ({ value: t.id, label: `${t.name} (${t.sport.name}, ${t.members.length}/${t.sport.maxPlayers})` }))} />
          </Field>
        )}
      </Modal>
    </>
  );
}
