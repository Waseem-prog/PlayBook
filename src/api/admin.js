import { request } from './http';

export const getQueue = () => request('/admin/queue');
export const getStats = () => request('/admin/stats');
