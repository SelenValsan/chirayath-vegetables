const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const SupplierLedgerTransaction = require('../models/SupplierLedgerTransaction');
const { recalculatePayableBalance } = require('../services/supplierLedgerService');

const getSupplierTransactions = asyncHandler(async (req, res) => {
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
    SupplierLedgerTransaction.find(filter).populate('shopId', 'name phone').sort('-date -createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
    SupplierLedgerTransaction.countDocuments(filter),
  ]);

  return success(res, transactions, 'Supplier transactions fetched successfully', 200, {
    page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
  });
});

const getSupplierLedger = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { shopId: req.params.id, voided: false };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const ledger = await SupplierLedgerTransaction.find(filter).sort('date createdAt');
  return success(res, ledger, 'Supplier ledger fetched successfully');
});

// Same scoped cleanup pattern as the customer-side ledger: only opening_balance
// and adjustment entries can be removed here, never purchases or payments.
const deleteSupplierLedgerTransaction = asyncHandler(async (req, res) => {
  const transaction = await SupplierLedgerTransaction.findById(req.params.id);
  if (!transaction) throw new ApiError('Transaction not found', 404);
  if (transaction.voided) throw new ApiError('This entry is already removed', 400);
  if (!['opening_balance', 'adjustment'].includes(transaction.type)) {
    throw new ApiError('Only opening balance and adjustment entries can be removed here. Purchases and payments must be deleted from their own page.', 400);
  }

  transaction.voided = true;
  await transaction.save();

  await recalculatePayableBalance(transaction.shopId);

  return success(res, {}, 'Ledger entry removed and balance updated');
});

module.exports = { getSupplierTransactions, getSupplierLedger, deleteSupplierLedgerTransaction };
