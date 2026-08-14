import api from './api';

export const getSupplierTransactions = (params) => api.get('/supplier-transactions', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const deleteSupplierLedgerTransaction = (id) => api.delete(`/supplier-transactions/${id}`).then((r) => r.data);
