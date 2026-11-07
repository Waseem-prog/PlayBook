import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { teamsApi } from '../../api';
import { PageHeader, Spinner, EmptyState, Tabs } from '../../components/ui';
import { TeamCard } from '../../components/cards';

export default function MyTeams() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const { data: teams, loading } = useAsync(() => teamsApi.listMyTeams());

  if (loading || !teams) return <Spinner />;

  const captained = teams.filter((t) => t.captainId === user.id);
  const shown = tab === 'captain' ? captained : tab === 'member' ? teams.filter((t) => t.captainId !== user.id) : teams;

  return (
    <>
      <PageHeader
        title="My teams"
        subtitle="Teams go live once the sports office approves them."
        actions={<Link to="/student/teams/new" className="btn-primary"><Plus className="h-4 w-4" /> Build a squad</Link>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', count: teams.length },
          { value: 'captain', label: 'Captain', count: captained.length },
          { value: 'member', label: 'Member', count: teams.length - captained.length },
        ]}
      />
      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              footer={
                t.adminNote && t.status !== 'approved' ? (
                  <p className="text-xs text-slate-500"><b>Sports office:</b> {t.adminNote}</p>
                ) : (
                  <Link to={`/student/teams/${t.id}`} className="text-sm font-medium text-brand-700 hover:underline">Manage team →</Link>
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={Users} title="No teams here" message="Create a team for any sport and invite your friends." action={<Link to="/student/teams/new" className="btn-primary btn-sm">Build a squad</Link>} />
        </div>
      )}
    </>
  );
}
