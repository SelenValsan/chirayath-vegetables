import api from './api';

export const getShops = (params) => api.get('/shops', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getShop = (id) => api.get(`/shops/${id}`).then((r) => r.data.data);
export const createShop = (payload) => api.post('/shops', payload).then((r) => r.data.data);
export const updateShop = (id, payload) => api.put(`/shops/${id}`, payload).then((r) => r.data.data);
export const updateShopStatus = (id, status) => api.patch(`/shops/${id}/status`, { status }).then((r) => r.data.data);
export const deleteShop = (id) => api.delete(`/shops/${id}`).then((r) => r.data);
export const permanentDeleteShop = (id, confirmName) =>
  api.delete(`/shops/${id}/permanent`, { data: { confirmName } }).then((r) => r.data);
export const getShopLedger = (id, params) => api.get(`/shops/${id}/ledger`, { params }).then((r) => r.data.data);
