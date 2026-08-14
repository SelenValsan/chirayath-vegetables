import api from './api';

export const getSupplierPayments = (params) => api.get('/supplier-payments', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getSupplierPayment = (id) => api.get(`/supplier-payments/${id}`).then((r) => r.data.data);
export const createSupplierPayment = (payload) => api.post('/supplier-payments', payload).then((r) => r.data.data);
export const updateSupplierPayment = (id, payload) => api.put(`/supplier-payments/${id}`, payload).then((r) => r.data.data);
export const deleteSupplierPayment = (id) => api.delete(`/supplier-payments/${id}`).then((r) => r.data.data);
