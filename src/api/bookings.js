import { respond, ApiError, uid, requireUser, requireAdmin, findOr404, venueOf, publicUser } from './db';
import { todayStr, toMinutes, OPEN_TIME, CLOSE_TIME } from '../utils/format';

const view = (db, b) => ({ ...b, venue: venueOf(db, b.venueId), user: publicUser(db, b.userId) });

// GET /api/bookings?date=&venue=  (everyone can see occupancy)
export const listBookings = ({ date = todayStr(), venueId = '' } = {}) =>
  respond((db) => {
    requireUser(db);
    return db.bookings
      .filter((b) => (!date || b.date === date) && (!venueId || b.venueId === venueId))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .map((b) => view(db, b));
  });

// GET /api/bookings/mine
export const listMyBookings = () =>
  respond((db) => {
    const user = requireUser(db);
    return db.bookings
      .filter((b) => b.userId === user.id)
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
      .map((b) => view(db, b));
  });

// POST /api/bookings  (same day only, 09:00-17:00, no overlaps)
export const createBooking = ({ venueId, startTime, endTime, purpose = '' }) =>
  respond((db) => {
    const user = requireUser(db);
    const venue = findOr404(db.venues, venueId, 'Venue');
    if (!venue.available) throw new ApiError(`${venue.name} is currently unavailable`);
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) throw new ApiError('Choose a start and end time');
    if (start < toMinutes(OPEN_TIME) || end > toMinutes(CLOSE_TIME)) throw new ApiError(`Venues are open ${OPEN_TIME}–${CLOSE_TIME} only`);
    if (end <= start) throw new ApiError('End time must be after the start time');
    if (end - start > 120) throw new ApiError('Bookings can be at most 2 hours long');
    const date = todayStr();
    const clash = db.bookings.find(
      (b) => b.venueId === venueId && b.date === date && start < toMinutes(b.endTime) && toMinutes(b.startTime) < end
    );
    if (clash) throw new ApiError(`${venue.name} is already booked ${clash.startTime}–${clash.endTime}`);
    const booking = { id: uid('b'), venueId, userId: user.id, date, startTime, endTime, purpose: purpose.trim(), createdAt: new Date().toISOString() };
    db.bookings.push(booking);
    return view(db, booking);
  });

// DELETE /api/bookings/:id (owner or admin)
export const cancelBooking = (id) =>
  respond((db) => {
    const user = requireUser(db);
    const booking = findOr404(db.bookings, id, 'Booking');
    if (booking.userId !== user.id && user.role !== 'admin') throw new ApiError('You can only cancel your own bookings', 403);
    db.bookings = db.bookings.filter((b) => b.id !== id);
    return true;
  });

// GET /api/bookings/all (admin)
export const listAllBookings = () =>
  respond((db) => {
    requireAdmin(db);
    return db.bookings
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
      .map((b) => view(db, b));
  });
