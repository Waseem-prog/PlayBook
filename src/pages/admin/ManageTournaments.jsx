import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { tournamentsApi } from '../../api';
import { PageHeader, Card, Spinner, Tabs, StatusBadge, Table, EmptyState } from '../../components/ui';
import { fmtRange } from '../../utils/format';

const TABS = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'review', label: 'Needs review', match: (t) => ['proposed', 'on_hold'].includes(t.status) },
  { value: 'open', label: 'Registration open', match: (t) => t.status === 'approved' },
  { value: 'ongoing', label: 'Ongoing', match: (t) => t.status === 'ongoing' },
  { value: 'closed', label: 'Closed', match: (t) => ['completed', 'cancelled', 'rejected'].includes(t.status) },
];

export default function ManageTournaments() {
  const [tab, setTab] = useState('all');
  const { data, loading } = useAsync(() => tournamentsApi.listTournaments());
  if (loading || !data) return <Spinner />;
  const rows = data.filter(TABS.find((t) => t.value === tab).match);

  return (
    <>
      <PageHeader
        title="Tournaments"
        subtitle="Control each tournament's status (proposed → approved → ongoing → completed or cancelled), confirm teams and run the bracket."
        actions={<Link to="/admin/tournaments/new" className="btn-primary"><Plus className="h-4 w-4" /> New tournament</Link>}
      />
      <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ ...t, count: data.filter(t.match).length }))} />
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          empty={<EmptyState icon={Trophy} title="No tournaments" />}
          columns={[
            { key: 'name', label: 'Tournament', render: (t) => <Link to={`/admin/tournaments/${t.id}`} className="font-medium text-slate-900 hover:text-brand-700">{t.name}</Link> },
            { key: 'sport', label: 'Sport', render: (t) => t.sport.name },
            { key: 'dates', label: 'Dates', render: (t) => <span className="whitespace-nowrap">{fmtRange(t.startDate, t.endDate)}</span> },
            { key: 'teams', label: 'Teams', render: (t) => `${t.registrations.filter((r) => r.status === 'confirmed').length} confirmed / ${t.registrations.filter((r) => r.status === 'pending').length} pending` },
            { key: 'organizer', label: 'Organiser', render: (t) => t.organizer.name },
            { key: 'status', label: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'go', label: '', render: (t) => <Link to={`/admin/tournaments/${t.id}`} className="btn-secondary btn-sm">Manage</Link> },
          ]}
        />
      </Card>
    </>
  );
}
