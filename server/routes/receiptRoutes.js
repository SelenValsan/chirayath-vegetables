const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReceipts, getReceipt } = require('../controllers/receiptController');

router.use(protect);
router.get('/', getReceipts);
router.get('/:id', getReceipt);

module.exports = router;
