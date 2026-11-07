import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Trophy, Users, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Avatar } from './ui';
import { fmtDateTime, fmtRange } from '../utils/format';

export const useBase = () => (useAuth().user?.role === 'admin' ? '/admin' : '/student');

// Single line summary of a match, used in dashboards and lists.
export function MatchRow({ match, showApproval = true }) {
  const base = useBase();
  const r = match.result;
  return (
    <Link to={`${base}/matches/${match.id}`} className="flex flex-col gap-2 rounded-lg px-3 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          <span className={r?.winnerId === match.homeTeam.id ? 'text-brand-700' : ''}>{match.homeTeam.name}</span>
          {r ? <span className="mx-2 font-bold text-slate-900">{r.homeScore} – {r.awayScore}</span> : <span className="mx-2 text-slate-400">vs</span>}
          <span className={r?.winnerId === match.awayTeam.id ? 'text-brand-700' : ''}>{match.awayTeam.name}</span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {fmtDateTime(match.dateTime)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {match.venue.name}</span>
          <span>{match.sport.name}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {showApproval && match.approval !== 'approved' && <StatusBadge status={match.approval} />}
        {match.approval === 'approved' && <StatusBadge status={match.status} />}
      </div>
    </Link>
  );
}

export function TeamCard({ team, footer }) {
  const base = useBase();
  const { user } = useAuth();
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`${base}/teams/${team.id}`} className="block truncate text-lg font-semibold text-slate-900 hover:text-brand-700">
            {team.name}
          </Link>
          <p className="text-sm text-slate-500">{team.sport.name}</p>
        </div>
        <StatusBadge status={team.status} />
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <Crown className="h-4 w-4 text-amber-500" /> {team.captain.name}
        {team.captain.id === user?.id && <span className="text-xs text-slate-400">(you)</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {team.members.slice(0, 6).map((m) => (
            <span key={m.id} className="rounded-full ring-2 ring-white" title={m.name}>
              <Avatar name={m.name} size="sm" />
            </span>
          ))}
          {team.members.length > 6 && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 ring-2 ring-white">+{team.members.length - 6}</span>}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" /> {team.members.length}/{team.sport.maxPlayers}
        </span>
      </div>
      {footer && <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div>}
    </div>
  );
}

export function TournamentCard({ tournament: t }) {
  const base = useBase();
  const confirmed = t.registrations.filter((r) => r.status === 'confirmed').length;
  return (
    <Link to={`${base}/tournaments/${t.id}`} className="card group flex flex-col p-5 transition hover:border-brand-300 hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
          <Trophy className="h-5 w-5" />
        </div>
        <StatusBadge status={t.status} label={t.status === 'approved' ? 'Registration open' : undefined} />
      </div>
      <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-700">{t.name}</h3>
      <p className="text-sm text-slate-500">{t.sport.name}</p>
      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {fmtRange(t.startDate, t.endDate)}</p>
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.venue.name}</p>
        <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {confirmed} team{confirmed === 1 ? '' : 's'} confirmed · by {t.organizer.name}</p>
      </div>
      {t.champion && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          <Crown className="h-3.5 w-3.5" /> Champion: {t.champion.name}
        </p>
      )}
    </Link>
  );
}
