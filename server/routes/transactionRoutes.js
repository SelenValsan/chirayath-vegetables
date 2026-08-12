const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTransactions, getTransaction } = require('../controllers/transactionController');

router.use(protect);
router.get('/', getTransactions);
router.get('/:id', getTransaction);

module.exports = router;
