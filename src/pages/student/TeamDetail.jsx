import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Crown, UserPlus, Trash2, Swords, RotateCcw, ArrowLeft, Check, Pause, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { teamsApi, usersApi, matchesApi } from '../../api';
import { PageHeader, Card, Spinner, StatusBadge, Avatar, ErrorState, EmptyState, StatCard } from '../../components/ui';
import { Modal, ConfirmDialog, ReviewDialog } from '../../components/Modal';
import PlayerPicker from '../../components/PlayerPicker';
import { MatchRow } from '../../components/cards';

export default function TeamDetail({ admin = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const [adding, setAdding] = useState(false);
  const [toAdd, setToAdd] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [disbanding, setDisbanding] = useState(false);
  const [review, setReview] = useState(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [team, players, matches] = await Promise.all([teamsApi.getTeam(id), usersApi.listStudents(), matchesApi.listMatches()]);
    return { team, players, matches: matches.filter((m) => m.homeTeam.id === id || m.awayTeam.id === id) };
  }, [id]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { team, players, matches } = data;
  const isCaptain = team.captainId === user.id;
  const full = team.members.length >= team.sport.maxPlayers;

  async function addMembers() {
    for (const pid of toAdd) {
      const { ok } = await run(() => teamsApi.addMember(team.id, pid));
      if (!ok) break;
    }
    setAdding(false);
    setToAdd([]);
    reload();
  }

  async function removeMember() {
    const { ok } = await run(() => teamsApi.removeMember(team.id, removing.id), `${removing.name} removed`);
    setRemoving(null);
    if (ok) reload();
  }

  async function disband() {
    const { ok } = await run(() => teamsApi.disbandTeam(team.id), 'Team disbanded');
    setDisbanding(false);
    if (ok) navigate('/student/teams');
  }

  async function submitReview(note) {
    const { ok } = await run(() => teamsApi.reviewTeam(team.id, review, note), 'Decision saved');
    setReview(null);
    if (ok) reload();
  }

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> Back</button>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {team.name} <StatusBadge status={team.status} />
          </span>
        }
        subtitle={`${team.sport.name} · squad of ${team.sport.minPlayers}–${team.sport.maxPlayers}`}
        actions={
          admin ? (
            team.status !== 'approved' && (
              <>
                <button className="btn-primary" onClick={() => setReview('approved')}><Check className="h-4 w-4" /> Approve</button>
                <button className="btn-secondary" onClick={() => setReview('on_hold')}><Pause className="h-4 w-4" /> Hold</button>
                <button className="btn-danger" onClick={() => setReview('rejected')}><X className="h-4 w-4" /> Reject</button>
              </>
            )
          ) : (
            isCaptain && (
              <>
                {team.status === 'approved' && (
                  <Link to={`/student/opponents?sport=${team.sportId}&team=${team.id}`} className="btn-primary"><Swords className="h-4 w-4" /> Find opponents</Link>
                )}
                {['rejected', 'on_hold'].includes(team.status) && (
                  <button className="btn-primary" disabled={busy} onClick={() => run(() => teamsApi.resubmitTeam(team.id), 'Resubmitted for approval').then(reload)}>
                    <RotateCcw className="h-4 w-4" /> Resubmit
                  </button>
                )}
                <button className="btn-secondary text-rose-600" onClick={() => setDisbanding(true)}><Trash2 className="h-4 w-4" /> Disband</button>
              </>
            )
          )
        }
      />

      {team.status === 'pending' && <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Waiting for the sports office to approve this team.</div>}
      {team.adminNote && team.status !== 'pending' && (
        <div className={`mb-4 rounded-lg p-3 text-sm ${team.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          <b>Sports office note:</b> {team.adminNote}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Played" value={team.record.played} tone="slate" />
        <StatCard label="Won" value={team.record.won} />
        <StatCard label="Drawn" value={team.record.drawn} tone="amber" />
        <StatCard label="Lost" value={team.record.lost} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-2"
          title={`Roster (${team.members.length}/${team.sport.maxPlayers})`}
          actions={
            isCaptain && !admin && (
              <button className="btn-secondary btn-sm" disabled={full} onClick={() => setAdding(true)} title={full ? 'Squad is full' : ''}>
                <UserPlus className="h-4 w-4" /> Add
              </button>
            )
          }
          bodyClass="divide-y divide-slate-100"
        >
          {team.members.length < team.sport.minPlayers && (
            <p className="bg-amber-50 px-5 py-2 text-xs text-amber-800">Needs {team.sport.minPlayers - team.members.length} more player(s) to meet the {team.sport.name} minimum.</p>
          )}
          {team.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {m.name} {m.id === team.captainId && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                </p>
                <p className="truncate text-xs text-slate-500">{m.profile?.position || 'No position'} · {m.profile?.skillLevel}</p>
              </div>
              {isCaptain && !admin && m.id !== team.captainId && (
                <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </Card>

        <Card className="lg:col-span-3" title="Matches" bodyClass="p-2">
          {matches.length ? matches.map((m) => <MatchRow key={m.id} match={m} />) : <EmptyState icon={Swords} title="No matches yet" />}
        </Card>
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add teammates"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" disabled={!toAdd.length || busy} onClick={addMembers}>Add {toAdd.length || ''} player{toAdd.length === 1 ? '' : 's'}</button>
          </>
        }
      >
        <PlayerPicker
          players={players}
          selected={toAdd}
          onToggle={(pid) => setToAdd((ids) => (ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid]))}
          sportId={team.sportId}
          exclude={team.memberIds}
          max={team.sport.maxPlayers - team.members.length}
        />
      </Modal>

      <ConfirmDialog
        open={!!removing}
        title="Remove player?"
        message={`Remove ${removing?.name} from ${team.name}?`}
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={removeMember}
        onClose={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={disbanding}
        title="Disband team?"
        message={`${team.name} will be deleted along with its tournament registrations. This cannot be undone.`}
        confirmLabel="Disband"
        danger
        busy={busy}
        onConfirm={disband}
        onClose={() => setDisbanding(false)}
      />
      <ReviewDialog open={!!review} decision={review} itemName={team.name} busy={busy} onSubmit={submitReview} onClose={() => setReview(null)} />
    </>
  );
}
