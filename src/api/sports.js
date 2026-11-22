import { request } from './http';

export const listSports = () => request('/sports');
export const createSport = (data) => request('/sports', { method: 'POST', body: data });
export const updateSport = (id, data) => request(`/sports/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
export const deleteSport = (id) => request(`/sports/${encodeURIComponent(id)}`, { method: 'DELETE' });
