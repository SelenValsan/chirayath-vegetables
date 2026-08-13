const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Payment = require('../models/Payment');
const Shop = require('../models/Shop');
const {
  createLedgerEntry,
  voidLedgerEntryByReference,
  updateLedgerEntryByReference,
  recalculateShopBalance,
} = require('../services/ledgerService');
const { createPaymentReceipt, voidReceiptByReference } = require('../services/receiptService');

// @route GET /api/payments?shopId=&method=&from=&to=&page=&limit=
const getPayments = asyncHandler(async (req, res) => {
  const { shopId, method, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (shopId) filter.shopId = shopId;
  if (method) filter.paymentMethod = method;
  if (from || to) {
    filter.paymentDate = {};
    if (from) filter.paymentDate.$gte = new Date(from);
    if (to) filter.paymentDate.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('shopId', 'name phone').sort('-paymentDate').skip((pageNum - 1) * limitNum).limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return success(res, payments, 'Payments fetched successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('shopId', 'name phone currentBalance');
  if (!payment) throw new ApiError('Payment not found', 404);
  return success(res, payment, 'Payment fetched successfully');
});

// @route POST /api/payments
const createPayment = asyncHandler(async (req, res) => {
  const { shopId, amount, direction, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  const shop = await Shop.findOne({ _id: shopId, isDeleted: false });
  if (!shop) throw new ApiError('Shop not found', 404);

  const amt = Number(amount);
  if (!(amt > 0)) throw new ApiError('Payment amount must be greater than 0', 400);

  const dir = direction === 'paid' ? 'paid' : 'received';
  const balanceBefore = shop.currentBalance;
  const payDate = paymentDate ? new Date(paymentDate) : new Date();

  const payment = await Payment.create({
    shopId,
    amount: amt,
    direction: dir,
    paymentMethod: paymentMethod || 'Cash',
    paymentDate: payDate,
    referenceNumber: referenceNumber || '',
    notes: notes || '',
    source: 'manual',
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createLedgerEntry({
    shopId,
    type: 'payment',
    debit: dir === 'paid' ? amt : 0,
    credit: dir === 'received' ? amt : 0,
    referenceId: payment._id,
    referenceType: 'Payment',
    description: dir === 'paid'
      ? `Cash paid to shop (${payment.paymentMethod})`
      : `Payment received (${payment.paymentMethod})`,
    date: payDate,
    createdBy: req.user._id,
  });

  await recalculateShopBalance(shopId);
  const updatedShop = await Shop.findById(shopId);
  const receipt = await createPaymentReceipt({ shop: updatedShop, payment, balanceBefore, createdBy: req.user._id });

  return success(res, { payment, receipt, balanceBefore, balanceAfter: updatedShop.currentBalance }, 'Payment recorded successfully', 201);
});

// @route PUT /api/payments/:id
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError('Payment not found', 404);
  if (payment.status === 'voided') throw new ApiError('Cannot edit a voided payment', 400);

  const { amount, direction, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  if (amount !== undefined) {
    const amt = Number(amount);
    if (!(amt > 0)) throw new ApiError('Payment amount must be greater than 0', 400);
    payment.amount = amt;
  }
  if (direction !== undefined) payment.direction = direction === 'paid' ? 'paid' : 'received';
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (paymentDate !== undefined) payment.paymentDate = new Date(paymentDate);
  if (referenceNumber !== undefined) payment.referenceNumber = referenceNumber;
  if (notes !== undefined) payment.notes = notes;
  payment.updatedBy = req.user._id;
  await payment.save();

  const dir = payment.direction;
  await updateLedgerEntryByReference(payment._id, 'Payment', {
    debit: dir === 'paid' ? payment.amount : 0,
    credit: dir === 'received' ? payment.amount : 0,
    date: payment.paymentDate,
    description: dir === 'paid'
      ? `Cash paid to shop (${payment.paymentMethod}) - edited`
      : `Payment received (${payment.paymentMethod}) - edited`,
  });

  await recalculateShopBalance(payment.shopId);
  const shop = await Shop.findById(payment.shopId);

  return success(res, { payment, shopBalance: shop.currentBalance }, 'Payment updated successfully');
});

// @route DELETE /api/payments/:id (void, not hard delete)
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError('Payment not found', 404);
  if (payment.status === 'voided') throw new ApiError('Payment is already voided', 400);

  payment.status = 'voided';
  payment.voidedAt = new Date();
  payment.updatedBy = req.user._id;
  await payment.save();

  await voidLedgerEntryByReference(payment._id, 'Payment');
  await voidReceiptByReference(payment._id, 'paymentId');

  await recalculateShopBalance(payment.shopId);
  const shop = await Shop.findById(payment.shopId);

  return success(res, { payment, shopBalance: shop.currentBalance }, 'Payment voided and shop balance updated');
});

module.exports = { getPayments, getPayment, createPayment, updatePayment, deletePayment };
