import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Swords, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { teamsApi, sportsApi } from '../../api';
import { PageHeader, FilterBar, Field, Select, Spinner, EmptyState } from '../../components/ui';
import { TeamCard } from '../../components/cards';
import ChallengeModal from '../../components/ChallengeModal';

export default function FindOpponents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [challenging, setChallenging] = useState(null);

  const { data: meta, loading } = useAsync(async () => {
    const [sports, teams] = await Promise.all([sportsApi.listSports(), teamsApi.listMyTeams()]);
    return { sports, myTeams: teams.filter((t) => t.captainId === user.id && t.status === 'approved') };
  });

  const sportId = params.get('sport') || '';
  const teamId = params.get('team') || '';

  // Default to the first team I captain.
  useEffect(() => {
    if (meta && !teamId && meta.myTeams.length) {
      setParams({ sport: meta.myTeams[0].sportId, team: meta.myTeams[0].id }, { replace: true });
    }
  }, [meta, teamId, setParams]);

  const { data: opponents, loading: loadingOpp } = useAsync(
    () => (sportId ? teamsApi.findOpponents({ sportId, teamId }) : Promise.resolve([])),
    [sportId, teamId]
  );

  if (loading || !meta) return <Spinner />;

  const myTeam = meta.myTeams.find((t) => t.id === teamId);
  const sportsWithTeams = meta.sports.filter((s) => meta.myTeams.some((t) => t.sportId === s.id));
  const teamsInSport = meta.myTeams.filter((t) => t.sportId === sportId);

  if (!meta.myTeams.length) {
    return (
      <>
        <PageHeader title="Find someone to play against" />
        <div className="card">
          <EmptyState
            icon={Swords}
            title="You need an approved team you captain"
            message="Create a team and wait for the sports office to approve it, then come back to challenge other teams."
            action={<Link to="/student/teams/new" className="btn-primary btn-sm">Build a squad</Link>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Find someone to play against" subtitle="Pick your sport and team to see every approved team you can challenge." />
      <FilterBar>
        <Field label="Sport">
          <Select
            value={sportId}
            onChange={(e) => {
              const first = meta.myTeams.find((t) => t.sportId === e.target.value);
              setParams({ sport: e.target.value, team: first?.id || '' });
            }}
            options={sportsWithTeams.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <Field label="Your team">
          <Select value={teamId} onChange={(e) => setParams({ sport: sportId, team: e.target.value })} options={teamsInSport.map((t) => ({ value: t.id, label: t.name }))} />
        </Field>
      </FilterBar>

      {loadingOpp && !opponents ? (
        <Spinner />
      ) : !opponents?.length ? (
        <div className="card"><EmptyState icon={Users} title="No opponents yet" message="No other approved teams play this sport right now." /></div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">{opponents.length} team{opponents.length > 1 ? 's' : ''} available to challenge</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {opponents.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                footer={
                  <button className="btn-primary btn-sm w-full" disabled={!myTeam} onClick={() => setChallenging(t)}>
                    <Swords className="h-4 w-4" /> Challenge
                  </button>
                }
              />
            ))}
          </div>
        </>
      )}

      <ChallengeModal
        open={!!challenging}
        homeTeam={myTeam}
        awayTeam={challenging}
        onClose={() => setChallenging(null)}
        onCreated={(m) => {
          setChallenging(null);
          navigate(`/student/matches/${m.id}`);
        }}
      />
    </>
  );
}
