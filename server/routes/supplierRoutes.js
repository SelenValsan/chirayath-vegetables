const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, permanentDeleteSupplier,
} = require('../controllers/supplierController');
const { getSupplierLedger } = require('../controllers/supplierTransactionController');

router.use(protect);
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.delete('/:id/permanent', permanentDeleteSupplier);
router.get('/:id/ledger', getSupplierLedger);

module.exports = router;
