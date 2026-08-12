const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboard, getSalesReport, getPaymentsReport, getOutstandingReport, getTopShops, getTopProducts,
} = require('../controllers/reportController');

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/payments', getPaymentsReport);
router.get('/outstanding', getOutstandingReport);
router.get('/top-shops', getTopShops);
router.get('/top-products', getTopProducts);

module.exports = router;
