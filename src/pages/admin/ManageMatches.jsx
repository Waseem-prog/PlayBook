import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, List } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { matchesApi } from '../../api';
import { PageHeader, Card, Spinner, Tabs, StatusBadge, Table, EmptyState } from '../../components/ui';
import MatchCalendar, { CalendarLegend } from '../../components/MatchCalendar';
import { fmtDateTime } from '../../utils/format';

const TABS = [
  { value: 'requests', label: 'Requests', match: (m) => m.approval !== 'approved' && m.approval !== 'rejected' },
  { value: 'scheduled', label: 'Scheduled', match: (m) => m.approval === 'approved' && m.status === 'scheduled' },
  { value: 'ongoing', label: 'Live', match: (m) => m.approval === 'approved' && m.status === 'ongoing' },
  { value: 'completed', label: 'Completed', match: (m) => m.status === 'completed' },
  { value: 'rejected', label: 'Rejected', match: (m) => m.approval === 'rejected' },
];

export default function ManageMatches() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('scheduled');
  const { busy, run } = useAction();
  const { data, loading, reload } = useAsync(() => matchesApi.listMatches());

  if (loading && !data) return <Spinner />;
  const rows = data.filter(TABS.find((t) => t.value === tab).match);
  const quick = (fn, msg) => run(fn, msg).then(({ ok }) => ok && reload());

  return (
    <>
      <PageHeader
        title="Matches"
        subtitle="Approve requests, move matches through scheduled → ongoing → completed and record results."
        actions={
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
            <button className={`btn btn-sm ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setView('list')}><List className="h-4 w-4" /> List</button>
            <button className={`btn btn-sm ${view === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setView('calendar')}><CalendarDays className="h-4 w-4" /> Calendar</button>
          </div>
        }
      />

      {view === 'calendar' ? (
        <Card bodyClass="p-3 sm:p-5">
          <div className="mb-3"><CalendarLegend /></div>
          <MatchCalendar matches={data.filter((m) => m.approval !== 'rejected')} onSelect={(m) => navigate(`/admin/matches/${m.id}`)} />
        </Card>
      ) : (
        <>
          <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ ...t, count: data.filter(t.match).length }))} />
          <Card bodyClass="p-0">
            <Table
              rows={rows}
              empty={<EmptyState icon={CalendarDays} title="No matches here" />}
              columns={[
                {
                  key: 'teams',
                  label: 'Match',
                  render: (m) => (
                    <Link to={`/admin/matches/${m.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {m.homeTeam.name} <span className="text-slate-400">vs</span> {m.awayTeam.name}
                    </Link>
                  ),
                },
                { key: 'sport', label: 'Sport', render: (m) => m.sport.name },
                { key: 'when', label: 'When', render: (m) => <span className="whitespace-nowrap">{fmtDateTime(m.dateTime)}</span> },
                { key: 'venue', label: 'Venue', render: (m) => m.venue.name },
                { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.approval === 'approved' ? m.status : m.approval} /> },
                { key: 'result', label: 'Result', render: (m) => (m.result ? <b>{m.result.homeScore} – {m.result.awayScore}</b> : <span className="text-slate-400">—</span>) },
                {
                  key: 'actions',
                  label: '',
                  render: (m) => (
                    <div className="flex justify-end gap-1.5">
                      {m.approval === 'pending' && (
                        <button className="btn-primary btn-sm" disabled={busy} onClick={() => quick(() => matchesApi.reviewMatch(m.id, 'approved'), 'Match approved')}>Approve</button>
                      )}
                      {m.approval === 'approved' && m.status === 'scheduled' && (
                        <button className="btn-secondary btn-sm" disabled={busy} onClick={() => quick(() => matchesApi.setMatchStatus(m.id, 'ongoing'), 'Match is live')}>Start</button>
                      )}
                      {m.status === 'ongoing' && (
                        <button className="btn-secondary btn-sm" disabled={busy} onClick={() => quick(() => matchesApi.setMatchStatus(m.id, 'completed'), 'Match completed')}>Complete</button>
                      )}
                      <Link to={`/admin/matches/${m.id}`} className="btn-ghost btn-sm">{m.status === 'completed' && !m.result ? 'Enter result' : 'Open'}</Link>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </>
  );
}
