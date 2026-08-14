import api from './api';

export const getSuppliers = (params) => api.get('/suppliers', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getSupplier = (id) => api.get(`/suppliers/${id}`).then((r) => r.data.data);
export const createSupplier = (payload) => api.post('/suppliers', payload).then((r) => r.data.data);
export const updateSupplier = (id, payload) => api.put(`/suppliers/${id}`, payload).then((r) => r.data.data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`).then((r) => r.data);
export const permanentDeleteSupplier = (id, confirmName) =>
  api.delete(`/suppliers/${id}/permanent`, { data: { confirmName } }).then((r) => r.data);
export const getSupplierLedger = (id, params) => api.get(`/suppliers/${id}/ledger`, { params }).then((r) => r.data.data);
