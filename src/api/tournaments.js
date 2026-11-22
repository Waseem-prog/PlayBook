import { request } from './http';

export { nextStatuses } from '../utils/tournamentStatus';

export const listTournaments = (options = {}) => request('/tournaments', { query: { status: options.status } });
export const getTournament = (id) => request(`/tournaments/${encodeURIComponent(id)}`);
export const proposeTournament = (data) => request('/tournaments', { method: 'POST', body: data });
export const registerTeam = (id, teamId) => request(`/tournaments/${encodeURIComponent(id)}/register`, { method: 'POST', body: { teamId } });
export const withdrawTeam = (id, teamId) => request(`/tournaments/${encodeURIComponent(id)}/register/${encodeURIComponent(teamId)}`, { method: 'DELETE' });
export const reviewRegistration = (id, teamId, status) => request(`/tournaments/${encodeURIComponent(id)}/registrations/${encodeURIComponent(teamId)}`, { method: 'PATCH', body: { status } });
export const setTournamentStatus = (id, status, note) => request(`/tournaments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status, note } });
export const generateBracket = (id, data) => request(`/tournaments/${encodeURIComponent(id)}/bracket`, { method: 'POST', body: data });
export const setBracketWinner = (id, roundIndex, matchIndex, teamId) => request(`/tournaments/${encodeURIComponent(id)}/bracket`, { method: 'PATCH', body: { roundIndex, matchIndex, teamId } });
