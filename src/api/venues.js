import { respond, ApiError, uid, requireAdmin, findOr404 } from './db';

function validate(db, { name, sportIds = [], available = true }, id) {
  if (!name?.trim()) throw new ApiError('Venue name is required');
  if (db.venues.some((v) => v.id !== id && v.name.toLowerCase() === name.trim().toLowerCase())) throw new ApiError('A venue with that name already exists');
  return { name: name.trim(), sportIds, available: !!available };
}

// GET /api/venues
export const listVenues = () => respond((db) => db.venues);

// POST /api/venues (admin)
export const createVenue = (data) =>
  respond((db) => {
    requireAdmin(db);
    const venue = { id: uid('ve'), ...validate(db, data) };
    db.venues.push(venue);
    return venue;
  });

// PUT /api/venues/:id (admin)
export const updateVenue = (id, data) =>
  respond((db) => {
    requireAdmin(db);
    const venue = findOr404(db.venues, id, 'Venue');
    Object.assign(venue, validate(db, { ...venue, ...data }, id));
    return venue;
  });

// DELETE /api/venues/:id (admin)
export const deleteVenue = (id) =>
  respond((db) => {
    requireAdmin(db);
    findOr404(db.venues, id, 'Venue');
    const inUse =
      db.matches.some((m) => m.venueId === id && m.status !== 'completed') ||
      db.tournaments.some((t) => t.venueId === id && ['proposed', 'approved', 'ongoing'].includes(t.status));
    if (inUse) throw new ApiError('Upcoming matches or tournaments use this venue. Mark it unavailable instead.');
    db.venues = db.venues.filter((v) => v.id !== id);
    db.bookings = db.bookings.filter((b) => b.venueId !== id);
    return true;
  });
