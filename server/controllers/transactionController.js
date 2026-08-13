const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const LedgerTransaction = require('../models/LedgerTransaction');
const { recalculateShopBalance } = require('../services/ledgerService');

// @route GET /api/transactions?shopId=&type=&from=&to=&search=&page=&limit=
// Global ledger view across all shops - the "Transactions" page
const getTransactions = asyncHandler(async (req, res) => {
  const { shopId, type, from, to, page = 1, limit = 25 } = req.query;
  const filter = { voided: false };
  if (shopId) filter.shopId = shopId;
  if (type) filter.type = type;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

  const [transactions, total] = await Promise.all([
    LedgerTransaction.find(filter)
      .populate('shopId', 'name phone')
      .sort('-date -createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    LedgerTransaction.countDocuments(filter),
  ]);

  return success(res, transactions, 'Transactions fetched successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await LedgerTransaction.findById(req.params.id).populate('shopId', 'name phone');
  if (!transaction) throw new ApiError('Transaction not found', 404);
  return success(res, transaction, 'Transaction fetched successfully');
});

// @route GET /api/shops/:id/ledger - full running ledger for one shop
const getShopLedger = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { shopId: req.params.id, voided: false };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const ledger = await LedgerTransaction.find(filter).sort('date createdAt');
  return success(res, ledger, 'Shop ledger fetched successfully');
});

// @route DELETE /api/transactions/:id
// Intentionally scoped: only 'opening_balance' and 'adjustment' entries can be removed here.
// Sale and payment entries carry their own real records (Entry/Payment) and must be
// voided through those, which correctly reverses receipts and linked records too -
// this endpoint would bypass that and corrupt the audit trail if allowed on them.
const deleteLedgerTransaction = asyncHandler(async (req, res) => {
  const transaction = await LedgerTransaction.findById(req.params.id);
  if (!transaction) throw new ApiError('Transaction not found', 404);
  if (transaction.voided) throw new ApiError('This entry is already removed', 400);
  if (!['opening_balance', 'adjustment'].includes(transaction.type)) {
    throw new ApiError('Only opening balance and adjustment entries can be removed here. Sales and payments must be deleted from their own page.', 400);
  }

  transaction.voided = true;
  await transaction.save();

  await recalculateShopBalance(transaction.shopId);

  return success(res, {}, 'Ledger entry removed and balance updated');
});

module.exports = { getTransactions, getTransaction, getShopLedger, deleteLedgerTransaction };
