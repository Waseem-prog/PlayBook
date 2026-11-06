// Mock persistence layer. Every API module goes through `respond`, which mimics
// an async HTTP call: it runs the handler against the in-memory db, persists the
// result to localStorage, and resolves with a deep copy (like a JSON response).
// In Deliverable 2 these modules will be swapped for Axios calls to Express.
import { buildSeed } from './seed';

const DB_KEY = 'playbook_db_v1';
const SESSION_KEY = 'playbook_session';
const LATENCY = 120;

let cache = null;

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

export function getDb() {
  if (!cache) {
    const raw = safeGet(DB_KEY);
    try {
      cache = raw ? JSON.parse(raw) : buildSeed();
    } catch {
      cache = buildSeed();
    }
    persist();
  }
  return cache;
}

function persist() {
  safeSet(DB_KEY, JSON.stringify(cache));
}

export function resetDb() {
  cache = buildSeed();
  persist();
}

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function respond(handler) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const db = getDb();
        const out = handler(db);
        persist();
        resolve(clone(out));
      } catch (err) {
        reject(err instanceof ApiError ? err : new ApiError(err.message || 'Something went wrong', 500));
      }
    }, LATENCY);
  });
}

export const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---- session (stands in for the JWT) ----
export const getSessionId = () => safeGet(SESSION_KEY);
export const setSessionId = (id) => safeSet(SESSION_KEY, id);

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
  const { password, ...rest } = u;
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
