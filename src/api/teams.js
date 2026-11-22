import { request } from './http';

export const listMyTeams = () => request('/teams/mine');
export const listTeams = (options = {}) => request('/teams', { query: { status: options.status, sport: options.sportId } });
export const getTeam = (id) => request(`/teams/${encodeURIComponent(id)}`);
export const createTeam = (data) => request('/teams', { method: 'POST', body: data });
export const addMember = (id, userId) => request(`/teams/${encodeURIComponent(id)}/members`, { method: 'POST', body: { userId } });
export const removeMember = (id, userId) => request(`/teams/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
export const resubmitTeam = (id) => request(`/teams/${encodeURIComponent(id)}/resubmit`, { method: 'POST' });
export const disbandTeam = (id) => request(`/teams/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const findOpponents = (options = {}) => request('/teams/opponents', { query: { sport: options.sportId, team: options.teamId } });
export const reviewTeam = (id, decision, note) => request(`/teams/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: { decision, note } });
