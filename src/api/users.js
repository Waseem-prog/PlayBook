import { request } from './http';

export const updateProfile = (data) => request('/users/me', { method: 'PUT', body: data });
export const listPlayers = (options = {}) => request('/users/players', { query: { sport: options.sportId, availableOnly: options.availableOnly, search: options.search } });
export const listStudents = () => request('/users/students');
export const listUsers = () => request('/users');
export const setRole = (id, role) => request(`/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: { role } });
export const removeUser = (id) => request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
