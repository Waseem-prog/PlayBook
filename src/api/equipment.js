import { request } from './http';

export const listEquipment = () => request('/equipment');
export const createEquipment = (data) => request('/equipment', { method: 'POST', body: data });
export const updateEquipment = (id, data) => request(`/equipment/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
export const deleteEquipment = (id) => request(`/equipment/${encodeURIComponent(id)}`, { method: 'DELETE' });
