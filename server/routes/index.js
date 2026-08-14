const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/shops', require('./shopRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/entries', require('./entryRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/transactions', require('./transactionRoutes'));
router.use('/receipts', require('./receiptRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/search', require('./searchRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/purchases', require('./purchaseRoutes'));
router.use('/supplier-payments', require('./supplierPaymentRoutes'));
router.use('/supplier-transactions', require('./supplierTransactionRoutes'));

module.exports = router;
