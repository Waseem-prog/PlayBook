import { request } from './http';

export const listVenues = () => request('/venues');
export const createVenue = (data) => request('/venues', { method: 'POST', body: data });
export const updateVenue = (id, data) => request(`/venues/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
export const deleteVenue = (id) => request(`/venues/${encodeURIComponent(id)}`, { method: 'DELETE' });
