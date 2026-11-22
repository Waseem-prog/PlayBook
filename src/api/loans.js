import { request } from './http';

export const listMyLoans = () => request('/loans/mine');
export const listLoans = (options = {}) => request('/loans', { query: { status: options.status } });
export const issueLoan = (data) => request('/loans', { method: 'POST', body: data });
export const returnLoan = (id) => request(`/loans/${encodeURIComponent(id)}/return`, { method: 'PATCH' });
