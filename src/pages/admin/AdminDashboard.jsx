import { Link } from 'react-router-dom';
import { ClipboardCheck, Users, CalendarDays, Trophy, MapPin, Package, AlertTriangle, GraduationCap } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { adminApi, matchesApi, loansApi } from '../../api';
import { PageHeader, Card, StatCard, Spinner, EmptyState } from '../../components/ui';
import { MatchRow } from '../../components/cards';
import { fmtShortDate, relativeDays } from '../../utils/format';

export default function AdminDashboard() {
  const { data, loading } = useAsync(async () => {
    const [stats, queue, matches, overdue] = await Promise.all([
      adminApi.getStats(),
      adminApi.getQueue(),
      matchesApi.listMatches({ approval: 'approved' }),
      loansApi.listLoans({ status: 'overdue' }),
    ]);
    return { stats, queue, matches, overdue };
  });

  if (loading || !data) return <Spinner />;
  const { stats, queue, matches, overdue } = data;
  const waiting = queue.teams.length + queue.matches.length + queue.tournaments.length;
  const upcoming = matches.filter((m) => m.status !== 'completed').slice(0, 6);

  return (
    <>
      <PageHeader title="Sports Office dashboard" subtitle="Approvals, fixtures, bookings and equipment at a glance." actions={<Link to="/admin/queue" className="btn-primary"><ClipboardCheck className="h-4 w-4" /> Review queue ({waiting})</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardCheck} tone="amber" label="Awaiting approval" value={waiting} hint={`${stats.pendingTeams} teams · ${stats.pendingMatches} matches · ${stats.pendingTournaments} tournaments`} />
        <StatCard icon={GraduationCap} label="Students" value={stats.students} hint={`${stats.teams} approved teams`} />
        <StatCard icon={CalendarDays} tone="sky" label="Upcoming matches" value={stats.upcomingMatches} />
        <StatCard icon={Trophy} tone="violet" label="Active tournaments" value={stats.liveTournaments} />
        <StatCard icon={MapPin} tone="slate" label="Bookings today" value={stats.bookingsToday} />
        <StatCard icon={Package} tone="sky" label="Items on loan" value={stats.activeLoans} />
        <StatCard icon={AlertTriangle} tone="rose" label="Overdue returns" value={stats.overdueLoans} />
        <StatCard icon={Users} tone="brand" label="Approved teams" value={stats.teams} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Upcoming fixtures" actions={<Link to="/admin/matches" className="text-sm font-medium text-brand-700 hover:underline">Manage</Link>} bodyClass="p-2">
          {upcoming.length ? upcoming.map((m) => <MatchRow key={m.id} match={m} />) : <EmptyState icon={CalendarDays} title="No upcoming matches" />}
        </Card>

        <div className="space-y-6">
          <Card title="Waiting on you" bodyClass="divide-y divide-slate-100">
            {waiting ? (
              <>
                {queue.teams.slice(0, 3).map((t) => (
                  <Link key={t.id} to={`/admin/teams/${t.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <p className="text-sm font-medium">New team: {t.name}</p>
                    <p className="text-xs text-slate-500">{t.sport.name} · {t.members.length} players</p>
                  </Link>
                ))}
                {queue.matches.slice(0, 3).map((m) => (
                  <Link key={m.id} to={`/admin/matches/${m.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <p className="text-sm font-medium">Match: {m.homeTeam.name} vs {m.awayTeam.name}</p>
                    <p className="text-xs text-slate-500">{fmtShortDate(m.dateTime)} · {m.venue.name}</p>
                  </Link>
                ))}
                {queue.tournaments.slice(0, 3).map((t) => (
                  <Link key={t.id} to={`/admin/tournaments/${t.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <p className="text-sm font-medium">Tournament: {t.name}</p>
                    <p className="text-xs text-slate-500">Proposed by {t.organizer.name}</p>
                  </Link>
                ))}
                <Link to="/admin/queue" className="block px-5 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-slate-50">Open full queue →</Link>
              </>
            ) : (
              <EmptyState icon={ClipboardCheck} title="All caught up" />
            )}
          </Card>

          <Card title="Overdue equipment" actions={<Link to="/admin/equipment" className="text-sm font-medium text-brand-700 hover:underline">Desk</Link>} bodyClass="divide-y divide-slate-100">
            {overdue.length ? (
              overdue.map((l) => (
                <div key={l.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{l.qty} × {l.equipment.name}</p>
                  <p className="text-xs text-rose-600">{l.user.name} · due {relativeDays(l.dueDate)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={Package} title="Nothing overdue" />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
