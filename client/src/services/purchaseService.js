import api from './api';

export const getPurchases = (params) => api.get('/purchases', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getPurchase = (id) => api.get(`/purchases/${id}`).then((r) => r.data.data);
export const createPurchase = (payload) => api.post('/purchases', payload).then((r) => r.data.data);
export const updatePurchase = (id, payload) => api.put(`/purchases/${id}`, payload).then((r) => r.data.data);
export const deletePurchase = (id, reason) => api.delete(`/purchases/${id}`, { data: { reason } }).then((r) => r.data.data);
