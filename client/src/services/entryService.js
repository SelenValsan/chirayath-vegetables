import api from './api';

export const getEntries = (params) => api.get('/entries', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta }));
export const getEntry = (id) => api.get(`/entries/${id}`).then((r) => r.data.data);
export const createEntry = (payload) => api.post('/entries', payload).then((r) => r.data.data);
export const updateEntry = (id, payload) => api.put(`/entries/${id}`, payload).then((r) => r.data.data);
export const deleteEntry = (id, reason) => api.delete(`/entries/${id}`, { data: { reason } }).then((r) => r.data.data);
