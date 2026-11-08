import { respond, ApiError, uid, requireUser, requireAdmin, findOr404, tournamentView } from './db';

// Allowed admin status changes. Review decisions (approve/hold/reject) and the
// lifecycle (approved -> ongoing -> completed, or cancelled) share one field.
const TRANSITIONS = {
  proposed: ['approved', 'on_hold', 'rejected'],
  on_hold: ['approved', 'rejected'],
  approved: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

export const nextStatuses = (status) => TRANSITIONS[status] || [];

const confirmedTeams = (t) => t.registrations.filter((r) => r.status === 'confirmed').map((r) => r.teamId);

// Single elimination. Seeds are paired top vs bottom so byes go to the top seeds.
function buildBracket(teamIds) {
  let size = 1;
  while (size < teamIds.length) size *= 2;
  const first = [];
  for (let i = 0; i < size / 2; i++) {
    const a = teamIds[i] ?? null;
    const b = teamIds[size - 1 - i] ?? null;
    first.push({ a, b, winner: b === null ? a : null });
  }
  const rounds = [first];
  for (let n = size / 4; n >= 1; n /= 2) rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, winner: null })));
  // Push bye winners into round 2.
  first.forEach((m, i) => m.winner && placeWinner(rounds, 0, i, m.winner));
  return rounds;
}

function placeWinner(rounds, r, i, teamId) {
  const next = rounds[r + 1];
  if (!next) return;
  const slot = next[Math.floor(i / 2)];
  if (i % 2 === 0) slot.a = teamId;
  else slot.b = teamId;
}

const hasResults = (bracket) => bracket?.some((round, r) => round.some((m) => m.winner && !(r === 0 && m.b === null)));

// GET /api/tournaments?status=
export const listTournaments = ({ status = '' } = {}) =>
  respond((db) => {
    const user = requireUser(db);
    return db.tournaments
      .filter((t) => user.role === 'admin' || !['rejected', 'on_hold', 'proposed'].includes(t.status) || t.organizerId === user.id)
      .filter((t) => !status || t.status === status)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .map((t) => tournamentView(db, t));
  });

// GET /api/tournaments/:id
export const getTournament = (id) =>
  respond((db) => {
    requireUser(db);
    return tournamentView(db, findOr404(db.tournaments, id, 'Tournament'));
  });

// POST /api/tournaments (students propose; admin-created ones are approved straight away)
export const proposeTournament = ({ name, sportId, venueId, startDate, endDate, description = '' }) =>
  respond((db) => {
    const user = requireUser(db);
    if (!name?.trim()) throw new ApiError('Tournament name is required');
    findOr404(db.sports, sportId, 'Sport');
    const venue = findOr404(db.venues, venueId, 'Venue');
    if (!venue.sportIds.includes(sportId)) throw new ApiError(`${venue.name} does not host this sport`);
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ApiError('Choose valid start and end dates');
    if (start < new Date(new Date().toDateString())) throw new ApiError('Start date cannot be in the past');
    if (end < start) throw new ApiError('End date must be on or after the start date');
    const tournament = {
      id: uid('tr'),
      name: name.trim(),
      sportId,
      venueId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      description: description.trim(),
      organizerId: user.id,
      status: user.role === 'admin' ? 'approved' : 'proposed',
      registrations: [],
      bracket: null,
      championId: null,
      adminNote: '',
      createdAt: new Date().toISOString(),
    };
    db.tournaments.push(tournament);
    return tournamentView(db, tournament);
  });

// POST /api/tournaments/:id/register
export const registerTeam = (tournamentId, teamId) =>
  respond((db) => {
    const user = requireUser(db);
    const t = findOr404(db.tournaments, tournamentId, 'Tournament');
    const team = findOr404(db.teams, teamId, 'Team');
    if (t.status !== 'approved') throw new ApiError('Registration is closed for this tournament');
    if (team.captainId !== user.id) throw new ApiError('Only the captain can register this team', 403);
    if (team.status !== 'approved') throw new ApiError('Your team must be approved before it can register');
    if (team.sportId !== t.sportId) throw new ApiError('This team plays a different sport');
    if (t.registrations.some((r) => r.teamId === teamId)) throw new ApiError('Team is already registered');
    t.registrations.push({ teamId, status: 'pending', registeredAt: new Date().toISOString() });
    return tournamentView(db, t);
  });

// DELETE /api/tournaments/:id/register/:teamId
export const withdrawTeam = (tournamentId, teamId) =>
  respond((db) => {
    const user = requireUser(db);
    const t = findOr404(db.tournaments, tournamentId, 'Tournament');
    const team = findOr404(db.teams, teamId, 'Team');
    if (team.captainId !== user.id && user.role !== 'admin') throw new ApiError('Only the captain can withdraw this team', 403);
    if (t.status !== 'approved') throw new ApiError('Teams can only withdraw before the tournament starts');
    t.registrations = t.registrations.filter((r) => r.teamId !== teamId);
    return tournamentView(db, t);
  });

// PATCH /api/tournaments/:id/registrations/:teamId (admin)
export const reviewRegistration = (tournamentId, teamId, status) =>
  respond((db) => {
    requireAdmin(db);
    if (!['confirmed', 'rejected', 'pending'].includes(status)) throw new ApiError('Invalid registration status');
    const t = findOr404(db.tournaments, tournamentId, 'Tournament');
    if (!['approved', 'proposed', 'on_hold'].includes(t.status)) throw new ApiError('Registrations are locked once the tournament starts');
    const reg = t.registrations.find((r) => r.teamId === teamId);
    if (!reg) throw new ApiError('Registration not found', 404);
    reg.status = status;
    if (t.bracket && !hasResults(t.bracket)) t.bracket = null; // roster changed, so the draw is stale
    return tournamentView(db, t);
  });

// PATCH /api/tournaments/:id/status (admin)
export const setTournamentStatus = (id, status, note) =>
  respond((db) => {
    requireAdmin(db);
    const t = findOr404(db.tournaments, id, 'Tournament');
    if (!nextStatuses(t.status).includes(status)) throw new ApiError(`Cannot move a tournament from ${t.status} to ${status}`);
    if (status === 'ongoing') {
      const teams = confirmedTeams(t);
      if (teams.length < 2) throw new ApiError('Confirm at least 2 teams before starting');
      if (!t.bracket) t.bracket = buildBracket(teams);
    }
    if (status === 'completed' && !t.championId) throw new ApiError('Finish the bracket (pick the final winner) before completing');
    t.status = status;
    if (note !== undefined) t.adminNote = note;
    return tournamentView(db, t);
  });

// POST /api/tournaments/:id/bracket (admin) - (re)draw from confirmed teams
export const generateBracket = (id, { shuffle = false } = {}) =>
  respond((db) => {
    requireAdmin(db);
    const t = findOr404(db.tournaments, id, 'Tournament');
    if (!['approved', 'ongoing'].includes(t.status)) throw new ApiError('Brackets can be drawn for approved or ongoing tournaments');
    if (hasResults(t.bracket)) throw new ApiError('Results are already recorded; the bracket can no longer be redrawn');
    const teams = confirmedTeams(t);
    if (teams.length < 2) throw new ApiError('Confirm at least 2 teams first');
    if (shuffle) teams.sort(() => Math.random() - 0.5);
    t.bracket = buildBracket(teams);
    t.championId = null;
    return tournamentView(db, t);
  });

// PATCH /api/tournaments/:id/bracket (admin) - pick the winner of one bracket match
export const setBracketWinner = (id, roundIndex, matchIndex, teamId) =>
  respond((db) => {
    requireAdmin(db);
    const t = findOr404(db.tournaments, id, 'Tournament');
    if (t.status !== 'ongoing') throw new ApiError('Start the tournament before recording bracket results');
    const m = t.bracket?.[roundIndex]?.[matchIndex];
    if (!m) throw new ApiError('Bracket match not found', 404);
    if (!m.a || !m.b) throw new ApiError('Both teams must be known before picking a winner');
    if (![m.a, m.b].includes(teamId)) throw new ApiError('Winner must be one of the two teams');
    const next = t.bracket[roundIndex + 1]?.[Math.floor(matchIndex / 2)];
    if (next?.winner) throw new ApiError('The next round is already decided; this result is locked');
    m.winner = teamId;
    if (roundIndex === t.bracket.length - 1) t.championId = teamId;
    else {
      // A changed result invalidates whatever the old winner had in the next slot.
      placeWinner(t.bracket, roundIndex, matchIndex, teamId);
      t.championId = null;
    }
    return tournamentView(db, t);
  });
