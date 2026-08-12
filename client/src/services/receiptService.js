import api from './api';

export const getReceipts = (params) => api.get('/receipts', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getReceipt = (id) => api.get(`/receipts/${id}`).then((r) => r.data.data);
