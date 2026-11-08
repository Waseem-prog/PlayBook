import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { tournamentsApi } from '../../api';
import { PageHeader, Spinner, EmptyState, Tabs } from '../../components/ui';
import { TournamentCard } from '../../components/cards';

const TABS = [
  { value: 'open', label: 'Open for registration', match: (t) => t.status === 'approved' },
  { value: 'ongoing', label: 'Ongoing', match: (t) => t.status === 'ongoing' },
  { value: 'past', label: 'Past', match: (t) => ['completed', 'cancelled'].includes(t.status) },
  { value: 'mine', label: 'My proposals', match: (t, u) => t.organizerId === u.id },
];

export default function Tournaments() {
  const { user } = useAuth();
  const [tab, setTab] = useState('open');
  const { data, loading } = useAsync(() => tournamentsApi.listTournaments());

  if (loading || !data) return <Spinner />;
  const current = TABS.find((t) => t.value === tab);
  const shown = data.filter((t) => current.match(t, user));

  return (
    <>
      <PageHeader
        title="Tournaments"
        subtitle="Browse upcoming tournaments, register your team, or propose your own."
        actions={<Link to="/student/tournaments/new" className="btn-primary"><Plus className="h-4 w-4" /> Propose a tournament</Link>}
      />
      <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ ...t, count: data.filter((x) => t.match(x, user)).length }))} />
      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      ) : (
        <div className="card"><EmptyState icon={Trophy} title="No tournaments here" message={tab === 'mine' ? 'Propose a tournament and the sports office will review it.' : undefined} /></div>
      )}
    </>
  );
}
