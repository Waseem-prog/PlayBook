import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Trophy, Check, Pause, X, Play, Flag, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { matchesApi } from '../../api';
import { Card, Spinner, StatusBadge, ErrorState, Field, Input } from '../../components/ui';
import { ConfirmDialog, ReviewDialog } from '../../components/Modal';
import { fmtDateTime, relativeDays } from '../../utils/format';

const STEPS = ['scheduled', 'ongoing', 'completed'];

export default function MatchDetail({ admin = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const [review, setReview] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [score, setScore] = useState({ homeScore: '', awayScore: '' });
  const base = admin ? '/admin' : '/student';

  const { data: m, loading, error, reload } = useAsync(() => matchesApi.getMatch(id), [id]);

  useEffect(() => {
    if (m?.result) setScore({ homeScore: m.result.homeScore, awayScore: m.result.awayScore });
  }, [m]);

  if (loading && !m) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const act = (fn, msg) => run(fn, msg).then(({ ok }) => ok && reload());
  const r = m.result;
  const step = STEPS.indexOf(m.status);
  const canCancel = (m.createdById === user.id || admin) && m.status === 'scheduled';

  const Side = ({ team, score: s, winner }) => (
    <div className="flex flex-1 flex-col items-center text-center">
      <Link to={`${base}/teams/${team.id}`} className={`text-lg font-bold hover:underline sm:text-2xl ${winner ? 'text-brand-700' : 'text-slate-900'}`}>{team.name}</Link>
      {winner && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Trophy className="h-3.5 w-3.5" /> Winner</span>}
      {s !== undefined && <p className="mt-2 text-4xl font-black text-slate-900 sm:text-5xl">{s}</p>}
    </div>
  );

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> Back</button>

      <Card bodyClass="p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <StatusBadge status={m.approval} label={m.approval === 'approved' ? 'Approved' : m.approval === 'pending' ? 'Awaiting approval' : undefined} />
          {m.approval === 'approved' && <StatusBadge status={m.status} />}
          <span className="text-xs text-slate-500">{m.sport.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <Side team={m.homeTeam} score={r?.homeScore} winner={r?.winnerId === m.homeTeam.id} />
          <span className="text-sm font-bold text-slate-400">{r ? '–' : 'VS'}</span>
          <Side team={m.awayTeam} score={r?.awayScore} winner={r?.winnerId === m.awayTeam.id} />
        </div>
        {r && !r.winnerId && <p className="mt-4 text-center text-sm font-medium text-slate-600">Match drawn</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-400" /> {fmtDateTime(m.dateTime)} ({relativeDays(m.dateTime)})</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {m.venue.name}</span>
        </div>
        {m.approval === 'approved' && (
          <ol className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className={`rounded-md py-1.5 text-center text-xs font-medium ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s[0].toUpperCase() + s.slice(1)}
              </li>
            ))}
          </ol>
        )}
        {m.adminNote && <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-600"><b>Sports office:</b> {m.adminNote}</p>}
        <p className="mt-4 text-center text-xs text-slate-400">Requested by {m.createdBy.name}</p>
      </Card>

      {(admin || canCancel) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {admin && (
            <Card title="Sports office controls">
              {m.approval !== 'approved' ? (
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={() => setReview('approved')}><Check className="h-4 w-4" /> Approve</button>
                  {m.approval !== 'on_hold' && <button className="btn-secondary" onClick={() => setReview('on_hold')}><Pause className="h-4 w-4" /> Hold</button>}
                  {m.approval !== 'rejected' && <button className="btn-danger" onClick={() => setReview('rejected')}><X className="h-4 w-4" /> Reject</button>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {m.status === 'scheduled' && (
                      <button className="btn-primary" disabled={busy} onClick={() => act(() => matchesApi.setMatchStatus(m.id, 'ongoing'), 'Match is live')}><Play className="h-4 w-4" /> Start match</button>
                    )}
                    {m.status === 'ongoing' && (
                      <button className="btn-primary" disabled={busy} onClick={() => act(() => matchesApi.setMatchStatus(m.id, 'completed'), 'Match completed')}><Flag className="h-4 w-4" /> Mark completed</button>
                    )}
                  </div>
                  {m.status === 'completed' && (
                    <form
                      className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(() => matchesApi.recordResult(m.id, score), 'Result saved');
                      }}
                    >
                      <Field label={m.homeTeam.name}>
                        <Input type="number" min="0" required value={score.homeScore} onChange={(e) => setScore({ ...score, homeScore: e.target.value })} />
                      </Field>
                      <Field label={m.awayTeam.name}>
                        <Input type="number" min="0" required value={score.awayScore} onChange={(e) => setScore({ ...score, awayScore: e.target.value })} />
                      </Field>
                      <button className="btn-primary col-span-2 sm:col-span-1" disabled={busy}>{r ? 'Update result' : 'Save result'}</button>
                    </form>
                  )}
                  {m.status !== 'completed' && <p className="text-xs text-slate-500">Results can be entered once the match is marked completed.</p>}
                </div>
              )}
            </Card>
          )}
          {canCancel && (
            <Card title="Cancel match">
              <p className="text-sm text-slate-600">Withdraw this match request. Both teams will no longer see it on the calendar.</p>
              <button className="btn-secondary mt-3 text-rose-600" onClick={() => setCancelling(true)}><Trash2 className="h-4 w-4" /> Cancel match</button>
            </Card>
          )}
        </div>
      )}

      <ReviewDialog
        open={!!review}
        decision={review}
        itemName={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
        busy={busy}
        onSubmit={(note) => act(() => matchesApi.reviewMatch(m.id, review, note), 'Decision saved').then(() => setReview(null))}
        onClose={() => setReview(null)}
      />
      <ConfirmDialog
        open={cancelling}
        title="Cancel this match?"
        message="The match will be removed. This cannot be undone."
        confirmLabel="Cancel match"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => matchesApi.cancelMatch(m.id), 'Match cancelled');
          setCancelling(false);
          if (ok) navigate(`${base}/matches`);
        }}
        onClose={() => setCancelling(false)}
      />
    </>
  );
}
