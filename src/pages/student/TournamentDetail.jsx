import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, User, Shuffle, Network, LogOut, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { tournamentsApi, teamsApi } from '../../api';
import { PageHeader, Card, Spinner, StatusBadge, ErrorState, EmptyState, Field, Select } from '../../components/ui';
import { ConfirmDialog, ReviewDialog } from '../../components/Modal';
import Bracket from '../../components/Bracket';
import { fmtRange, fmtShortDate, labelOf } from '../../utils/format';

const STATUS_STEPS = ['proposed', 'approved', 'ongoing', 'completed'];
const ACTION_LABELS = { approved: 'Approve', on_hold: 'Put on hold', rejected: 'Reject', ongoing: 'Start tournament', completed: 'Mark completed', cancelled: 'Cancel tournament' };

export default function TournamentDetail({ admin = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const [teamId, setTeamId] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [t, myTeams] = await Promise.all([tournamentsApi.getTournament(id), admin ? Promise.resolve([]) : teamsApi.listMyTeams()]);
    return { t, myTeams };
  }, [id]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { t, myTeams } = data;
  const nameOf = (tid) => t.registrations.find((r) => r.teamId === tid)?.team.name || 'Unknown';
  const registeredIds = t.registrations.map((r) => r.teamId);
  const eligible = myTeams.filter((m) => m.captainId === user.id && m.status === 'approved' && m.sportId === t.sportId && !registeredIds.includes(m.id));
  const mine = t.registrations.filter((r) => myTeams.some((m) => m.id === r.teamId && m.captainId === user.id));
  const confirmed = t.registrations.filter((r) => r.status === 'confirmed');
  const nextStatuses = tournamentsApi.nextStatuses(t.status);
  const stepIndex = STATUS_STEPS.indexOf(t.status);

  const act = (fn, msg) => run(fn, msg).then(({ ok }) => ok && reload());

  async function changeStatus(note) {
    await act(() => tournamentsApi.setTournamentStatus(t.id, pendingStatus, note), `Tournament ${labelOf(pendingStatus).toLowerCase()}`);
    setPendingStatus(null);
  }

  const reviewable = ['approved', 'on_hold', 'rejected'].includes(pendingStatus) && ['proposed', 'on_hold'].includes(t.status);

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> Back</button>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{t.name} <StatusBadge status={t.status} label={t.status === 'approved' ? 'Registration open' : undefined} /></span>}
        subtitle={t.sport.name}
        actions={
          admin &&
          nextStatuses.map((s) => (
            <button key={s} className={['rejected', 'cancelled'].includes(s) ? 'btn-danger' : s === 'on_hold' ? 'btn-secondary' : 'btn-primary'} onClick={() => setPendingStatus(s)}>
              {ACTION_LABELS[s]}
            </button>
          ))
        }
      />

      {/* status progress */}
      {!['rejected', 'cancelled', 'on_hold'].includes(t.status) && (
        <ol className="mb-6 grid grid-cols-4 gap-2">
          {STATUS_STEPS.map((s, i) => (
            <li key={s} className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${i <= stepIndex ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-400'}`}>
              {labelOf(s)}
            </li>
          ))}
        </ol>
      )}
      {t.adminNote && (
        <div className={`mb-4 rounded-lg p-3 text-sm ${['rejected', 'cancelled', 'on_hold'].includes(t.status) ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
          <b>Sports office note:</b> {t.adminNote}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details">
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3"><CalendarDays className="h-4 w-4 text-slate-400" /><dd>{fmtRange(t.startDate, t.endDate)}</dd></div>
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-slate-400" /><dd>{t.venue.name}</dd></div>
            <div className="flex gap-3"><User className="h-4 w-4 text-slate-400" /><dd>Organised by {t.organizer.name}</dd></div>
          </dl>
          {t.description && <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">{t.description}</p>}

          {!admin && t.status === 'approved' && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-semibold">Register your team</p>
              {eligible.length ? (
                <div className="flex gap-2">
                  <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Choose team" options={eligible.map((m) => ({ value: m.id, label: m.name }))} />
                  <button className="btn-primary shrink-0" disabled={!teamId || busy} onClick={() => act(() => tournamentsApi.registerTeam(t.id, teamId), 'Registration sent').then(() => setTeamId(''))}>
                    Register
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {mine.length ? 'Your eligible teams are already registered.' : `You need an approved ${t.sport.name} team that you captain.`}
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2" title={`Participating teams (${confirmed.length} confirmed)`} bodyClass="divide-y divide-slate-100">
          {t.registrations.length ? (
            t.registrations.map((r) => {
              const isMine = mine.some((m) => m.teamId === r.teamId);
              return (
                <div key={r.teamId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.team.name} {isMine && <span className="text-xs text-slate-400">(your team)</span>}</p>
                    <p className="text-xs text-slate-500">Registered {fmtShortDate(r.registeredAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                  {admin && ['proposed', 'approved', 'on_hold'].includes(t.status) && (
                    <div className="flex gap-1">
                      {r.status !== 'confirmed' && (
                        <button className="btn-secondary btn-sm" onClick={() => act(() => tournamentsApi.reviewRegistration(t.id, r.teamId, 'confirmed'), `${r.team.name} confirmed`)}>
                          <Check className="h-3.5 w-3.5" /> Confirm
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => act(() => tournamentsApi.reviewRegistration(t.id, r.teamId, 'rejected'), `${r.team.name} rejected`)}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  )}
                  {!admin && isMine && t.status === 'approved' && (
                    <button className="btn-ghost btn-sm text-rose-600" onClick={() => act(() => tournamentsApi.withdrawTeam(t.id, r.teamId), 'Team withdrawn')}>
                      <LogOut className="h-3.5 w-3.5" /> Withdraw
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState title="No teams registered yet" message={t.status === 'approved' ? 'Captains of approved teams can register from this page.' : undefined} />
          )}
        </Card>
      </div>

      <Card
        className="mt-6"
        title="Bracket"
        actions={
          admin &&
          ['approved', 'ongoing'].includes(t.status) && (
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" disabled={busy || confirmed.length < 2} onClick={() => act(() => tournamentsApi.generateBracket(t.id), 'Bracket drawn')}>
                <Network className="h-4 w-4" /> {t.bracket ? 'Redraw' : 'Draw bracket'}
              </button>
              <button className="btn-secondary btn-sm" disabled={busy || confirmed.length < 2} onClick={() => act(() => tournamentsApi.generateBracket(t.id, { shuffle: true }), 'Bracket shuffled')}>
                <Shuffle className="h-4 w-4" /> Shuffle
              </button>
            </div>
          )
        }
      >
        {t.bracket ? (
          <Bracket
            bracket={t.bracket}
            teamName={nameOf}
            championId={t.championId}
            onPick={admin ? (r, i, tid) => act(() => tournamentsApi.setBracketWinner(t.id, r, i, tid), `${nameOf(tid)} advances`) : undefined}
            disabled={t.status !== 'ongoing'}
          />
        ) : (
          <EmptyState
            icon={Network}
            title="Bracket not drawn yet"
            message={admin ? 'Confirm at least 2 teams, then draw the bracket (or start the tournament to draw it automatically).' : 'The bracket appears once the sports office draws it.'}
          />
        )}
      </Card>

      {reviewable ? (
        <ReviewDialog open decision={pendingStatus} itemName={t.name} busy={busy} onSubmit={changeStatus} onClose={() => setPendingStatus(null)} />
      ) : (
        <ConfirmDialog
          open={!!pendingStatus}
          title={ACTION_LABELS[pendingStatus]}
          message={
            pendingStatus === 'ongoing'
              ? `Registration closes and ${confirmed.length} confirmed teams go into the bracket.`
              : pendingStatus === 'completed'
              ? 'The tournament will be marked completed with the current champion.'
              : 'This tournament will be cancelled for all teams.'
          }
          confirmLabel={ACTION_LABELS[pendingStatus]}
          danger={pendingStatus === 'cancelled'}
          busy={busy}
          onConfirm={() => changeStatus()}
          onClose={() => setPendingStatus(null)}
        />
      )}
    </>
  );
}
