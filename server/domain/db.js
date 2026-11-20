import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const context = new AsyncLocalStorage();
export const runWithData = (db, userId, handler) => context.run({ db, userId }, handler);
export const respond = handler => handler(context.getStore().db);
const getSessionId = () => context.getStore().userId;
export const uid = prefix => prefix + '_' + randomUUID();

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export { ApiError };

export function currentUser(db) {
  const id = getSessionId();
  return db.users.find((u) => u.id === id) || null;
}

export function requireUser(db) {
  const user = currentUser(db);
  if (!user) throw new ApiError('Please log in to continue', 401);
  return user;
}

export function requireAdmin(db) {
  const user = requireUser(db);
  if (user.role !== 'admin') throw new ApiError('Admins only', 403);
  return user;
}

export function findOr404(list, id, label) {
  const item = list.find((x) => x.id === id);
  if (!item) throw new ApiError(`${label} not found`, 404);
  return item;
}

// ---- population helpers (stand in for Mongoose populate) ----
export function publicUser(db, id) {
  const u = db.users.find((x) => x.id === id);
  if (!u) return { id, name: 'Deleted user', email: '' };
  const { passwordHash, ...rest } = u;
  return rest;
}

export const sportOf = (db, id) => db.sports.find((s) => s.id === id) || { id, name: 'Unknown sport' };
export const venueOf = (db, id) => db.venues.find((v) => v.id === id) || { id, name: 'Unknown venue' };

export function teamView(db, team) {
  return {
    ...team,
    sport: sportOf(db, team.sportId),
    captain: publicUser(db, team.captainId),
    members: team.memberIds.map((id) => publicUser(db, id)),
  };
}

export function teamBrief(db, id) {
  const t = db.teams.find((x) => x.id === id);
  return t ? { id: t.id, name: t.name, captainId: t.captainId } : { id, name: 'Deleted team' };
}

export function matchView(db, m) {
  return {
    ...m,
    sport: sportOf(db, m.sportId),
    venue: venueOf(db, m.venueId),
    homeTeam: teamBrief(db, m.homeTeamId),
    awayTeam: teamBrief(db, m.awayTeamId),
    createdBy: publicUser(db, m.createdById),
    tournament: m.tournamentId ? { id: m.tournamentId, name: db.tournaments.find((t) => t.id === m.tournamentId)?.name } : null,
  };
}

export function tournamentView(db, t) {
  return {
    ...t,
    sport: sportOf(db, t.sportId),
    venue: venueOf(db, t.venueId),
    organizer: publicUser(db, t.organizerId),
    registrations: t.registrations.map((r) => ({ ...r, team: teamBrief(db, r.teamId) })),
    champion: t.championId ? teamBrief(db, t.championId) : null,
  };
}
