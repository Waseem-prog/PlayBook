import { respond, ApiError, uid, requireUser, requireAdmin, findOr404, matchView } from './db';

const STATUS_FLOW = ['scheduled', 'ongoing', 'completed'];
const CLASH_WINDOW = 2 * 60 * 60 * 1000; // matches at the same venue must be 2h apart

const involves = (db, m, userId) =>
  [m.homeTeamId, m.awayTeamId].some((tid) => db.teams.find((t) => t.id === tid)?.memberIds.includes(userId));

// GET /api/matches
// Students see every approved match plus any match their teams are part of; admins see all.
export const listMatches = ({ approval = '', status = '', mineOnly = false } = {}) =>
  respond((db) => {
    const user = requireUser(db);
    return db.matches
      .filter((m) => user.role === 'admin' || m.approval === 'approved' || involves(db, m, user.id))
      .filter((m) => !mineOnly || involves(db, m, user.id))
      .filter((m) => !approval || m.approval === approval)
      .filter((m) => !status || m.status === status)
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .map((m) => matchView(db, m));
  });

// GET /api/matches/:id
export const getMatch = (id) =>
  respond((db) => {
    requireUser(db);
    return matchView(db, findOr404(db.matches, id, 'Match'));
  });

// POST /api/matches (challenge another team)
export const createMatch = ({ homeTeamId, awayTeamId, venueId, dateTime }) =>
  respond((db) => {
    const user = requireUser(db);
    const home = findOr404(db.teams, homeTeamId, 'Your team');
    const away = findOr404(db.teams, awayTeamId, 'Opponent');
    const venue = findOr404(db.venues, venueId, 'Venue');
    if (home.captainId !== user.id) throw new ApiError('Only the captain can schedule matches for this team', 403);
    if (home.id === away.id) throw new ApiError('A team cannot play itself');
    if (home.status !== 'approved' || away.status !== 'approved') throw new ApiError('Both teams must be approved by the sports office');
    if (home.sportId !== away.sportId) throw new ApiError('Teams must play the same sport');
    if (!venue.available) throw new ApiError(`${venue.name} is currently unavailable`);
    if (!venue.sportIds.includes(home.sportId)) throw new ApiError(`${venue.name} does not host this sport`);
    const when = new Date(dateTime);
    if (Number.isNaN(when.getTime())) throw new ApiError('Choose a valid date and time');
    if (when < new Date()) throw new ApiError('Match time must be in the future');
    const clash = db.matches.find(
      (m) => m.venueId === venueId && m.approval !== 'rejected' && m.status !== 'completed' && Math.abs(new Date(m.dateTime) - when) < CLASH_WINDOW
    );
    if (clash) throw new ApiError(`${venue.name} already has a match within 2 hours of that time`);
    const match = {
      id: uid('m'),
      homeTeamId,
      awayTeamId,
      sportId: home.sportId,
      venueId,
      dateTime: when.toISOString(),
      approval: 'pending',
      status: 'scheduled',
      result: null,
      tournamentId: null,
      createdById: user.id,
      adminNote: '',
      createdAt: new Date().toISOString(),
    };
    db.matches.push(match);
    return matchView(db, match);
  });

// DELETE /api/matches/:id (creator withdraws a match that hasn't started)
export const cancelMatch = (id) =>
  respond((db) => {
    const user = requireUser(db);
    const match = findOr404(db.matches, id, 'Match');
    if (match.createdById !== user.id && user.role !== 'admin') throw new ApiError('Only the team that scheduled this match can cancel it', 403);
    if (match.status !== 'scheduled') throw new ApiError('Matches that have started cannot be cancelled');
    db.matches = db.matches.filter((m) => m.id !== id);
    return true;
  });

// PATCH /api/matches/:id/review (admin)
export const reviewMatch = (id, decision, note = '') =>
  respond((db) => {
    requireAdmin(db);
    if (!['approved', 'rejected', 'on_hold'].includes(decision)) throw new ApiError('Invalid decision');
    const match = findOr404(db.matches, id, 'Match');
    match.approval = decision;
    match.adminNote = note;
    return matchView(db, match);
  });

// PATCH /api/matches/:id/status (admin) - forward only: scheduled -> ongoing -> completed
export const setMatchStatus = (id, status) =>
  respond((db) => {
    requireAdmin(db);
    const match = findOr404(db.matches, id, 'Match');
    if (match.approval !== 'approved') throw new ApiError('Approve the match before changing its status');
    const from = STATUS_FLOW.indexOf(match.status);
    const to = STATUS_FLOW.indexOf(status);
    if (to !== from + 1) throw new ApiError(`Cannot move a match from ${match.status} to ${status}`);
    match.status = status;
    return matchView(db, match);
  });

// PUT /api/matches/:id/result (admin)
export const recordResult = (id, { homeScore, awayScore }) =>
  respond((db) => {
    requireAdmin(db);
    const match = findOr404(db.matches, id, 'Match');
    if (match.status !== 'completed') throw new ApiError('Mark the match completed before entering a result');
    const h = Number(homeScore);
    const a = Number(awayScore);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) throw new ApiError('Scores must be whole numbers, 0 or more');
    match.result = { homeScore: h, awayScore: a, winnerId: h === a ? null : h > a ? match.homeTeamId : match.awayTeamId };
    return matchView(db, match);
  });
