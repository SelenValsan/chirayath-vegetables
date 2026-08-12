import api from './api';

export const getTransactions = (params) => api.get('/transactions', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getTransaction = (id) => api.get(`/transactions/${id}`).then((r) => r.data.data);
