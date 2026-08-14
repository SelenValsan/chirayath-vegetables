const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');

router.use(protect);
router.get('/', getPurchases);
router.post('/', createPurchase);
router.get('/:id', getPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
