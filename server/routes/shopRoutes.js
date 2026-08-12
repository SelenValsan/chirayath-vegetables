const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getShops, getShop, createShop, updateShop, updateShopStatus, deleteShop, permanentDeleteShop,
} = require('../controllers/shopController');
const { getShopLedger } = require('../controllers/transactionController');

router.use(protect);
router.get('/', getShops);
router.post('/', createShop);
router.get('/:id', getShop);
router.put('/:id', updateShop);
router.delete('/:id', deleteShop);
router.delete('/:id/permanent', permanentDeleteShop);
router.patch('/:id/status', updateShopStatus);
router.get('/:id/ledger', getShopLedger);

module.exports = router;
