const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSupplierPayments, getSupplierPayment, createSupplierPayment, updateSupplierPayment, deleteSupplierPayment,
} = require('../controllers/supplierPaymentController');

router.use(protect);
router.get('/', getSupplierPayments);
router.post('/', createSupplierPayment);
router.get('/:id', getSupplierPayment);
router.put('/:id', updateSupplierPayment);
router.delete('/:id', deleteSupplierPayment);

module.exports = router;
