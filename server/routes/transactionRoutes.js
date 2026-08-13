const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTransactions, getTransaction, deleteLedgerTransaction } = require('../controllers/transactionController');

router.use(protect);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.delete('/:id', deleteLedgerTransaction);

module.exports = router;
