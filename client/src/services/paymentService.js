import api from './api';

export const getPayments = (params) => api.get('/payments', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getPayment = (id) => api.get(`/payments/${id}`).then((r) => r.data.data);
export const createPayment = (payload) => api.post('/payments', payload).then((r) => r.data.data);
export const updatePayment = (id, payload) => api.put(`/payments/${id}`, payload).then((r) => r.data.data);
export const deletePayment = (id) => api.delete(`/payments/${id}`).then((r) => r.data.data);
