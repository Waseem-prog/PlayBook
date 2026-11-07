import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, List, Swords } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { matchesApi } from '../../api';
import { PageHeader, Card, Spinner, Tabs, Toggle, EmptyState } from '../../components/ui';
import { MatchRow } from '../../components/cards';
import MatchCalendar, { CalendarLegend } from '../../components/MatchCalendar';

export default function Matches() {
  const navigate = useNavigate();
  const [view, setView] = useState('calendar');
  const [mineOnly, setMineOnly] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const { data, loading } = useAsync(() => matchesApi.listMatches({ mineOnly }), [mineOnly]);

  if (loading && !data) return <Spinner />;

  const upcoming = data.filter((m) => m.status !== 'completed' && m.approval !== 'rejected');
  const past = data.filter((m) => m.status === 'completed').reverse();
  const requests = data.filter((m) => m.approval !== 'approved');
  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : requests;

  return (
    <>
      <PageHeader
        title="Matches"
        subtitle="Approved matches appear on the calendar with live status. Results show once a match is completed."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
              <button className={`btn btn-sm ${view === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setView('calendar')}><CalendarDays className="h-4 w-4" /> Calendar</button>
              <button className={`btn btn-sm ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setView('list')}><List className="h-4 w-4" /> List</button>
            </div>
            <Link to="/student/opponents" className="btn-primary"><Swords className="h-4 w-4" /> Schedule a match</Link>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Toggle checked={mineOnly} onChange={setMineOnly} label="Only my teams' matches" />
        {view === 'calendar' && <CalendarLegend />}
      </div>

      {view === 'calendar' ? (
        <Card bodyClass="p-3 sm:p-5">
          <MatchCalendar matches={data.filter((m) => m.approval !== 'rejected')} onSelect={(m) => navigate(`/student/matches/${m.id}`)} />
        </Card>
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { value: 'past', label: 'Results', count: past.length },
              { value: 'requests', label: 'Requests', count: requests.length },
            ]}
          />
          <Card bodyClass="p-2">
            {list.length ? list.map((m) => <MatchRow key={m.id} match={m} />) : <EmptyState icon={CalendarDays} title="No matches" />}
          </Card>
        </>
      )}
    </>
  );
}
