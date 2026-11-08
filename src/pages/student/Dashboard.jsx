import { Link } from 'react-router-dom';
import { Users, CalendarDays, MapPin, Package, Plus, Swords, UserSearch, Trophy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { teamsApi, matchesApi, bookingsApi, loansApi, tournamentsApi } from '../../api';
import { PageHeader, Card, StatCard, Spinner, EmptyState, StatusBadge } from '../../components/ui';
import { MatchRow, TournamentCard } from '../../components/cards';
import { todayStr, fmtDate } from '../../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useAsync(async () => {
    const [teams, matches, bookings, loans, tournaments] = await Promise.all([
      teamsApi.listMyTeams(),
      matchesApi.listMatches({ mineOnly: true }),
      bookingsApi.listMyBookings(),
      loansApi.listMyLoans(),
      tournamentsApi.listTournaments({ status: 'approved' }),
    ]);
    return { teams, matches, bookings, loans, tournaments };
  });

  if (loading || !data) return <Spinner />;

  const upcoming = data.matches.filter((m) => m.status !== 'completed' && m.approval !== 'rejected');
  const recent = data.matches.filter((m) => m.status === 'completed').slice(-3).reverse();
  const todays = data.bookings.filter((b) => b.date === todayStr());
  const activeLoans = data.loans.filter((l) => !l.returnedAt);
  const overdue = activeLoans.filter((l) => l.overdue);
  const profileIncomplete = !user.profile.sportIds.length || !user.profile.position;

  return (
    <>
      <PageHeader
        title={`Hi, ${user.name.split(' ')[0]} 👋`}
        subtitle={fmtDate(new Date().toISOString())}
        actions={
          <>
            <Link to="/student/teams/new" className="btn-primary"><Plus className="h-4 w-4" /> New team</Link>
            <Link to="/student/book" className="btn-secondary"><MapPin className="h-4 w-4" /> Book a venue</Link>
          </>
        }
      />

      {overdue.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            You have <b>{overdue.length}</b> overdue equipment loan{overdue.length > 1 ? 's' : ''}. Please return{' '}
            {overdue.map((l) => `${l.qty} × ${l.equipment.name}`).join(', ')} to the equipment room.{' '}
            <Link to="/student/equipment" className="font-medium underline">View loans</Link>
          </p>
        </div>
      )}
      {profileIncomplete && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 sm:flex-row sm:items-center sm:justify-between">
          <p>Complete your player profile (sports, position, availability) so captains can find you.</p>
          <Link to="/student/profile" className="btn-primary btn-sm">Edit profile</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="My teams" value={data.teams.length} hint={`${data.teams.filter((t) => t.status === 'pending').length} awaiting approval`} />
        <StatCard icon={CalendarDays} tone="sky" label="Upcoming matches" value={upcoming.length} />
        <StatCard icon={MapPin} tone="violet" label="Bookings today" value={todays.length} />
        <StatCard icon={Package} tone={overdue.length ? 'rose' : 'amber'} label="Items on loan" value={activeLoans.length} hint={overdue.length ? `${overdue.length} overdue` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Upcoming matches" actions={<Link to="/student/matches" className="text-sm font-medium text-brand-700 hover:underline">Calendar</Link>} bodyClass="p-2">
            {upcoming.length ? (
              upcoming.slice(0, 5).map((m) => <MatchRow key={m.id} match={m} />)
            ) : (
              <EmptyState icon={Swords} title="No upcoming matches" message="Challenge another team from the opponent finder." action={<Link to="/student/opponents" className="btn-secondary btn-sm">Find opponents</Link>} />
            )}
          </Card>
          <Card title="Recent results" bodyClass="p-2">
            {recent.length ? recent.map((m) => <MatchRow key={m.id} match={m} />) : <EmptyState title="No results yet" />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="My teams" actions={<Link to="/student/teams" className="text-sm font-medium text-brand-700 hover:underline">All</Link>} bodyClass="divide-y divide-slate-100">
            {data.teams.length ? (
              data.teams.map((t) => (
                <Link key={t.id} to={`/student/teams/${t.id}`} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.sport.name} · {t.members.length} players</p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))
            ) : (
              <EmptyState icon={Users} title="You're not on a team yet" action={<Link to="/student/teams/new" className="btn-primary btn-sm">Build a squad</Link>} />
            )}
          </Card>
          <Card title="Today's bookings" bodyClass="divide-y divide-slate-100">
            {todays.length ? (
              todays.map((b) => (
                <div key={b.id} className="px-5 py-3 text-sm">
                  <p className="font-medium">{b.venue.name}</p>
                  <p className="text-xs text-slate-500">{b.startTime}–{b.endTime} {b.purpose && `· ${b.purpose}`}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={MapPin} title="No bookings today" />
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/student/players" className="card flex flex-col items-center gap-2 p-4 text-center text-sm font-medium hover:border-brand-300"><UserSearch className="h-5 w-5 text-brand-600" /> Find players</Link>
            <Link to="/student/tournaments/new" className="card flex flex-col items-center gap-2 p-4 text-center text-sm font-medium hover:border-brand-300"><Trophy className="h-5 w-5 text-amber-500" /> Propose tournament</Link>
          </div>
        </div>
      </div>

      {data.tournaments.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open tournaments</h2>
            <Link to="/student/tournaments" className="text-sm font-medium text-brand-700 hover:underline">Browse all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.tournaments.slice(0, 3).map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </div>
      )}
    </>
  );
}
