const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPayments, getPayment, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');

router.use(protect);
router.get('/', getPayments);
router.post('/', createPayment);
router.get('/:id', getPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;
