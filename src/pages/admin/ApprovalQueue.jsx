import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pause, X, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { adminApi, teamsApi, matchesApi, tournamentsApi } from '../../api';
import { PageHeader, Card, Spinner, Tabs, StatusBadge, EmptyState } from '../../components/ui';
import { ReviewDialog } from '../../components/Modal';
import { fmtDateTime, fmtRange, fmtShortDate } from '../../utils/format';

function Actions({ onDecide, status }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button className="btn-primary btn-sm" onClick={() => onDecide('approved')}><Check className="h-3.5 w-3.5" /> Approve</button>
      {status !== 'on_hold' && <button className="btn-secondary btn-sm" onClick={() => onDecide('on_hold')}><Pause className="h-3.5 w-3.5" /> Hold</button>}
      <button className="btn-secondary btn-sm text-rose-600" onClick={() => onDecide('rejected')}><X className="h-3.5 w-3.5" /> Reject</button>
    </div>
  );
}

function Row({ to, title, status, meta, children, warning }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={to} className="font-semibold text-slate-900 hover:text-brand-700">{title}</Link>
          <StatusBadge status={status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{meta}</p>
        {warning && <p className="mt-1 flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> {warning}</p>}
      </div>
      {children}
    </div>
  );
}

export default function ApprovalQueue() {
  const [tab, setTab] = useState('teams');
  const [review, setReview] = useState(null); // { kind, item, decision }
  const { busy, run } = useAction();
  const { data, loading, reload } = useAsync(() => adminApi.getQueue());

  if (loading && !data) return <Spinner />;

  async function submit(note) {
    const { kind, item, decision } = review;
    const fn = {
      team: () => teamsApi.reviewTeam(item.id, decision, note),
      match: () => matchesApi.reviewMatch(item.id, decision, note),
      tournament: () => tournamentsApi.setTournamentStatus(item.id, decision, note),
    }[kind];
    const { ok } = await run(fn, 'Decision saved');
    setReview(null);
    if (ok) reload();
  }

  const name = review && (review.kind === 'match' ? `${review.item.homeTeam.name} vs ${review.item.awayTeam.name}` : review.item.name);

  return (
    <>
      <PageHeader title="Approval queue" subtitle="Every new team, match request and tournament proposal waits here for the sports office." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'teams', label: 'Teams', count: data.teams.length },
          { value: 'matches', label: 'Matches', count: data.matches.length },
          { value: 'tournaments', label: 'Tournaments', count: data.tournaments.length },
        ]}
      />
      <Card bodyClass="divide-y divide-slate-100">
        {tab === 'teams' &&
          (data.teams.length ? (
            data.teams.map((t) => (
              <Row
                key={t.id}
                to={`/admin/teams/${t.id}`}
                title={t.name}
                status={t.status}
                meta={`${t.sport.name} · captain ${t.captain.name} · ${t.members.length} players · submitted ${fmtShortDate(t.createdAt)}`}
                warning={t.members.length < t.sport.minPlayers ? `Below the ${t.sport.name} minimum of ${t.sport.minPlayers} players, so it can't be approved yet` : null}
              >
                <Actions status={t.status} onDecide={(decision) => setReview({ kind: 'team', item: t, decision })} />
              </Row>
            ))
          ) : (
            <EmptyState icon={ClipboardCheck} title="No teams waiting" />
          ))}

        {tab === 'matches' &&
          (data.matches.length ? (
            data.matches.map((m) => (
              <Row
                key={m.id}
                to={`/admin/matches/${m.id}`}
                title={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
                status={m.approval}
                meta={`${m.sport.name} · ${fmtDateTime(m.dateTime)} · ${m.venue.name} · requested by ${m.createdBy.name}`}
                warning={new Date(m.dateTime) < new Date() ? 'Scheduled time has already passed' : null}
              >
                <Actions status={m.approval} onDecide={(decision) => setReview({ kind: 'match', item: m, decision })} />
              </Row>
            ))
          ) : (
            <EmptyState icon={ClipboardCheck} title="No match requests" />
          ))}

        {tab === 'tournaments' &&
          (data.tournaments.length ? (
            data.tournaments.map((t) => (
              <Row key={t.id} to={`/admin/tournaments/${t.id}`} title={t.name} status={t.status} meta={`${t.sport.name} · ${fmtRange(t.startDate, t.endDate)} · ${t.venue.name} · proposed by ${t.organizer.name}`}>
                <Actions status={t.status} onDecide={(decision) => setReview({ kind: 'tournament', item: t, decision })} />
              </Row>
            ))
          ) : (
            <EmptyState icon={ClipboardCheck} title="No tournament proposals" />
          ))}
      </Card>

      <ReviewDialog open={!!review} decision={review?.decision} itemName={name} busy={busy} onSubmit={submit} onClose={() => setReview(null)} />
    </>
  );
}
