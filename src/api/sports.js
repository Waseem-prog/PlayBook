import { respond, ApiError, uid, requireAdmin, findOr404 } from './db';

function validate(db, { name, minPlayers, maxPlayers }, id) {
  if (!name?.trim()) throw new ApiError('Sport name is required');
  const min = Number(minPlayers);
  const max = Number(maxPlayers);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1) throw new ApiError('Squad sizes must be whole numbers of at least 1');
  if (min > max) throw new ApiError('Minimum players cannot exceed maximum');
  if (db.sports.some((s) => s.id !== id && s.name.toLowerCase() === name.trim().toLowerCase())) throw new ApiError('That sport already exists');
  return { name: name.trim(), minPlayers: min, maxPlayers: max };
}

// GET /api/sports
export const listSports = () => respond((db) => db.sports);

// POST /api/sports (admin)
export const createSport = (data) =>
  respond((db) => {
    requireAdmin(db);
    const sport = { id: uid('sp'), ...validate(db, data) };
    db.sports.push(sport);
    return sport;
  });

// PUT /api/sports/:id (admin)
export const updateSport = (id, data) =>
  respond((db) => {
    requireAdmin(db);
    const sport = findOr404(db.sports, id, 'Sport');
    Object.assign(sport, validate(db, data, id));
    return sport;
  });

// DELETE /api/sports/:id (admin)
export const deleteSport = (id) =>
  respond((db) => {
    requireAdmin(db);
    findOr404(db.sports, id, 'Sport');
    if (db.teams.some((t) => t.sportId === id) || db.tournaments.some((t) => t.sportId === id)) {
      throw new ApiError('Teams or tournaments use this sport, so it cannot be deleted');
    }
    db.sports = db.sports.filter((s) => s.id !== id);
    db.venues.forEach((v) => (v.sportIds = v.sportIds.filter((s) => s !== id)));
    return true;
  });
