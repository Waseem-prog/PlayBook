import { request } from './http';

export const listBookings = (options = {}) => request('/bookings', { query: { date: options.date, venue: options.venueId } });
export const listMyBookings = () => request('/bookings/mine');
export const createBooking = (data) => request('/bookings', { method: 'POST', body: data });
export const cancelBooking = (id) => request(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const listAllBookings = () => request('/bookings/all');
