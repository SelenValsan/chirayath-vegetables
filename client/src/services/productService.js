import api from './api';

export const getProducts = (params) => api.get('/products', { params }).then((r) => r.data.data);
export const createProduct = (payload) => api.post('/products', payload).then((r) => r.data.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);
