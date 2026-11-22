import { request } from './http';

export const listMatches = (options = {}) => request('/matches', { query: { approval: options.approval, status: options.status, mineOnly: options.mineOnly } });
export const getMatch = (id) => request(`/matches/${encodeURIComponent(id)}`);
export const createMatch = (data) => request('/matches', { method: 'POST', body: data });
export const cancelMatch = (id) => request(`/matches/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const reviewMatch = (id, decision, note) => request(`/matches/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: { decision, note } });
export const setMatchStatus = (id, status) => request(`/matches/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
export const recordResult = (id, data) => request(`/matches/${encodeURIComponent(id)}/result`, { method: 'PUT', body: data });
