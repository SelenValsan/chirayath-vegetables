const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupplierTransactions, deleteSupplierLedgerTransaction } = require('../controllers/supplierTransactionController');

router.use(protect);
router.get('/', getSupplierTransactions);
router.delete('/:id', deleteSupplierLedgerTransaction);

module.exports = router;
