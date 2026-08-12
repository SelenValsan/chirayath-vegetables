import api from './api';

export const getDashboard = () => api.get('/reports/dashboard').then((r) => r.data.data);
export const getSalesReport = (params) => api.get('/reports/sales', { params }).then((r) => r.data.data);
export const getPaymentsReport = (params) => api.get('/reports/payments', { params }).then((r) => r.data.data);
export const getOutstandingReport = () => api.get('/reports/outstanding').then((r) => r.data.data);
export const getTopShops = (params) => api.get('/reports/top-shops', { params }).then((r) => r.data.data);
export const getTopProducts = (params) => api.get('/reports/top-products', { params }).then((r) => r.data.data);
