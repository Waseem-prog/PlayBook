import { respond, ApiError, uid, requireUser, requireAdmin, findOr404, teamView, sportOf } from './db';

const REVIEW_DECISIONS = ['approved', 'rejected', 'on_hold'];

function requireCaptain(db, teamId) {
  const user = requireUser(db);
  const team = findOr404(db.teams, teamId, 'Team');
  if (team.captainId !== user.id) throw new ApiError('Only the team captain can do this', 403);
  return { user, team };
}

// GET /api/teams/mine
export const listMyTeams = () =>
  respond((db) => {
    const user = requireUser(db);
    return db.teams.filter((t) => t.memberIds.includes(user.id) || t.captainId === user.id).map((t) => teamView(db, t));
  });

// GET /api/teams?status=&sport=
export const listTeams = ({ status = '', sportId = '' } = {}) =>
  respond((db) => {
    const user = requireUser(db);
    // Students only see approved teams (plus their own); admins see everything.
    return db.teams
      .filter((t) => user.role === 'admin' || t.status === 'approved' || t.memberIds.includes(user.id))
      .filter((t) => !status || t.status === status)
      .filter((t) => !sportId || t.sportId === sportId)
      .map((t) => teamView(db, t));
  });

// GET /api/teams/:id
export const getTeam = (id) =>
  respond((db) => {
    requireUser(db);
    const team = findOr404(db.teams, id, 'Team');
    const matches = db.matches.filter((m) => m.homeTeamId === id || m.awayTeamId === id);
    const played = matches.filter((m) => m.result);
    const record = {
      played: played.length,
      won: played.filter((m) => m.result.winnerId === id).length,
      drawn: played.filter((m) => !m.result.winnerId).length,
    };
    record.lost = record.played - record.won - record.drawn;
    return { ...teamView(db, team), record };
  });

// POST /api/teams
export const createTeam = ({ name, sportId, memberIds = [] }) =>
  respond((db) => {
    const user = requireUser(db);
    if (user.role !== 'student') throw new ApiError('Only students can create teams', 403);
    if (!name?.trim()) throw new ApiError('Team name is required');
    const sport = findOr404(db.sports, sportId, 'Sport');
    if (db.teams.some((t) => t.name.toLowerCase() === name.trim().toLowerCase() && t.status !== 'rejected')) {
      throw new ApiError('A team with this name already exists');
    }
    const members = [...new Set([user.id, ...memberIds])];
    if (members.length > sport.maxPlayers) throw new ApiError(`${sport.name} squads can have at most ${sport.maxPlayers} players`);
    const team = {
      id: uid('t'),
      name: name.trim(),
      sportId,
      captainId: user.id,
      memberIds: members,
      status: 'pending',
      adminNote: '',
      createdAt: new Date().toISOString(),
    };
    db.teams.push(team);
    return teamView(db, team);
  });

// POST /api/teams/:id/members
export const addMember = (teamId, userId) =>
  respond((db) => {
    const { team } = requireCaptain(db, teamId);
    const sport = sportOf(db, team.sportId);
    const player = findOr404(db.users, userId, 'Player');
    if (player.role !== 'student') throw new ApiError('Only students can join teams');
    if (team.memberIds.includes(userId)) throw new ApiError(`${player.name} is already on the team`);
    if (team.memberIds.length >= sport.maxPlayers) throw new ApiError(`Squad is full (max ${sport.maxPlayers} for ${sport.name})`);
    team.memberIds.push(userId);
    return teamView(db, team);
  });

// DELETE /api/teams/:id/members/:userId
export const removeMember = (teamId, userId) =>
  respond((db) => {
    const { team } = requireCaptain(db, teamId);
    const sport = sportOf(db, team.sportId);
    if (userId === team.captainId) throw new ApiError('The captain cannot be removed');
    if (!team.memberIds.includes(userId)) throw new ApiError('That player is not on the team');
    if (team.status === 'approved' && team.memberIds.length <= sport.minPlayers) {
      throw new ApiError(`Approved ${sport.name} teams need at least ${sport.minPlayers} players. Add someone first.`);
    }
    team.memberIds = team.memberIds.filter((id) => id !== userId);
    return teamView(db, team);
  });

// POST /api/teams/:id/resubmit (after a rejection or hold)
export const resubmitTeam = (teamId) =>
  respond((db) => {
    const { team } = requireCaptain(db, teamId);
    if (!['rejected', 'on_hold'].includes(team.status)) throw new ApiError('Only rejected or on-hold teams can be resubmitted');
    team.status = 'pending';
    return teamView(db, team);
  });

// DELETE /api/teams/:id (captain disbands)
export const disbandTeam = (teamId) =>
  respond((db) => {
    requireCaptain(db, teamId);
    if (db.matches.some((m) => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.status !== 'completed' && m.approval !== 'rejected')) {
      throw new ApiError('This team has upcoming matches. Cancel them first.');
    }
    db.teams = db.teams.filter((t) => t.id !== teamId);
    db.tournaments.forEach((t) => (t.registrations = t.registrations.filter((r) => r.teamId !== teamId)));
    return true;
  });

// GET /api/teams/opponents?sport=&team=
export const findOpponents = ({ sportId, teamId }) =>
  respond((db) => {
    requireUser(db);
    return db.teams
      .filter((t) => t.status === 'approved' && t.sportId === sportId && t.id !== teamId)
      .map((t) => teamView(db, t));
  });

// PATCH /api/teams/:id/review (admin)
export const reviewTeam = (teamId, decision, note = '') =>
  respond((db) => {
    requireAdmin(db);
    if (!REVIEW_DECISIONS.includes(decision)) throw new ApiError('Invalid decision');
    const team = findOr404(db.teams, teamId, 'Team');
    const sport = sportOf(db, team.sportId);
    if (decision === 'approved' && team.memberIds.length < sport.minPlayers) {
      throw new ApiError(`${team.name} has ${team.memberIds.length} players; ${sport.name} needs at least ${sport.minPlayers}`);
    }
    team.status = decision;
    team.adminNote = note;
    return teamView(db, team);
  });
