import { respond, requireAdmin, teamView, matchView, tournamentView, resetDb } from './db';
import { isOverdue } from './loans';
import { todayStr } from '../utils/format';

const WAITING = ['pending', 'on_hold'];

// GET /api/admin/queue - everything waiting for the sports office
export const getQueue = () =>
  respond((db) => {
    requireAdmin(db);
    return {
      teams: db.teams.filter((t) => WAITING.includes(t.status)).map((t) => teamView(db, t)),
      matches: db.matches.filter((m) => WAITING.includes(m.approval)).map((m) => matchView(db, m)),
      tournaments: db.tournaments.filter((t) => ['proposed', 'on_hold'].includes(t.status)).map((t) => tournamentView(db, t)),
    };
  });

// GET /api/admin/stats
export const getStats = () =>
  respond((db) => {
    requireAdmin(db);
    return {
      students: db.users.filter((u) => u.role === 'student').length,
      teams: db.teams.filter((t) => t.status === 'approved').length,
      pendingTeams: db.teams.filter((t) => WAITING.includes(t.status)).length,
      pendingMatches: db.matches.filter((m) => WAITING.includes(m.approval)).length,
      pendingTournaments: db.tournaments.filter((t) => ['proposed', 'on_hold'].includes(t.status)).length,
      upcomingMatches: db.matches.filter((m) => m.approval === 'approved' && m.status !== 'completed').length,
      liveTournaments: db.tournaments.filter((t) => ['approved', 'ongoing'].includes(t.status)).length,
      bookingsToday: db.bookings.filter((b) => b.date === todayStr()).length,
      activeLoans: db.loans.filter((l) => !l.returnedAt).length,
      overdueLoans: db.loans.filter(isOverdue).length,
    };
  });

// Demo helper: restore the seed data (no equivalent in the real API)
export const resetDemoData = () =>
  new Promise((resolve) => {
    resetDb();
    resolve(true);
  });
