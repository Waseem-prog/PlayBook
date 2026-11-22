import { request } from './http';

export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } });
export const register = (data) => request('/auth/register', { method: 'POST', body: data });
export const me = () => request('/auth/me');
export const logout = () => request('/auth/logout', { method: 'POST' });
