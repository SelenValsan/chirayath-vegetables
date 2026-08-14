const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const SupplierPayment = require('../models/SupplierPayment');
const Shop = require('../models/Shop');
const {
  createLedgerEntry, voidLedgerEntryByReference, updateLedgerEntryByReference, recalculatePayableBalance,
} = require('../services/supplierLedgerService');

const getSupplierPayments = asyncHandler(async (req, res) => {
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
    SupplierPayment.find(filter).populate('shopId', 'name phone').sort('-paymentDate').skip((pageNum - 1) * limitNum).limit(limitNum),
    SupplierPayment.countDocuments(filter),
  ]);

  return success(res, payments, 'Supplier payments fetched successfully', 200, {
    page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
  });
});

const getSupplierPayment = asyncHandler(async (req, res) => {
  const payment = await SupplierPayment.findById(req.params.id).populate('shopId', 'name phone payableBalance');
  if (!payment) throw new ApiError('Payment not found', 404);
  return success(res, payment, 'Payment fetched successfully');
});

const createSupplierPayment = asyncHandler(async (req, res) => {
  const { shopId, amount, direction, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  const supplier = await Shop.findOne({ _id: shopId, isDeleted: false });
  if (!supplier) throw new ApiError('Supplier not found', 404);
  if (!['supplier', 'both'].includes(supplier.partyType)) {
    throw new ApiError('This business is not marked as a Supplier.', 400);
  }

  const amt = Number(amount);
  if (!(amt > 0)) throw new ApiError('Payment amount must be greater than 0', 400);

  const dir = direction === 'received' ? 'received' : 'paid';
  const balanceBefore = supplier.payableBalance;
  const payDate = paymentDate ? new Date(paymentDate) : new Date();

  const payment = await SupplierPayment.create({
    shopId, amount: amt, direction: dir,
    paymentMethod: paymentMethod || 'Cash', paymentDate: payDate,
    referenceNumber: referenceNumber || '', notes: notes || '', source: 'manual',
    createdBy: req.user._id, updatedBy: req.user._id,
  });

  await createLedgerEntry({
    shopId, type: 'payment',
    debit: dir === 'received' ? amt : 0,
    credit: dir === 'paid' ? amt : 0,
    referenceId: payment._id, referenceType: 'SupplierPayment',
    description: dir === 'paid' ? `Cash paid to supplier (${payment.paymentMethod})` : `Cash received from supplier (${payment.paymentMethod})`,
    date: payDate, createdBy: req.user._id,
  });

  await recalculatePayableBalance(shopId);
  const updated = await Shop.findById(shopId);

  return success(res, { payment, balanceBefore, balanceAfter: updated.payableBalance }, 'Payment recorded successfully', 201);
});

const updateSupplierPayment = asyncHandler(async (req, res) => {
  const payment = await SupplierPayment.findById(req.params.id);
  if (!payment) throw new ApiError('Payment not found', 404);
  if (payment.status === 'voided') throw new ApiError('Cannot edit a voided payment', 400);

  const { amount, direction, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  if (amount !== undefined) {
    const amt = Number(amount);
    if (!(amt > 0)) throw new ApiError('Payment amount must be greater than 0', 400);
    payment.amount = amt;
  }
  if (direction !== undefined) payment.direction = direction === 'received' ? 'received' : 'paid';
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (paymentDate !== undefined) payment.paymentDate = new Date(paymentDate);
  if (referenceNumber !== undefined) payment.referenceNumber = referenceNumber;
  if (notes !== undefined) payment.notes = notes;
  payment.updatedBy = req.user._id;
  await payment.save();

  const dir = payment.direction;
  await updateLedgerEntryByReference(payment._id, 'SupplierPayment', {
    debit: dir === 'received' ? payment.amount : 0,
    credit: dir === 'paid' ? payment.amount : 0,
    date: payment.paymentDate,
    description: dir === 'paid' ? `Cash paid to supplier (${payment.paymentMethod}) - edited` : `Cash received from supplier (${payment.paymentMethod}) - edited`,
  });

  await recalculatePayableBalance(payment.shopId);
  const supplier = await Shop.findById(payment.shopId);

  return success(res, { payment, payableBalance: supplier.payableBalance }, 'Payment updated successfully');
});

const deleteSupplierPayment = asyncHandler(async (req, res) => {
  const payment = await SupplierPayment.findById(req.params.id);
  if (!payment) throw new ApiError('Payment not found', 404);
  if (payment.status === 'voided') throw new ApiError('Payment is already voided', 400);

  payment.status = 'voided';
  payment.voidedAt = new Date();
  payment.updatedBy = req.user._id;
  await payment.save();

  await voidLedgerEntryByReference(payment._id, 'SupplierPayment');

  await recalculatePayableBalance(payment.shopId);
  const supplier = await Shop.findById(payment.shopId);

  return success(res, { payment, payableBalance: supplier.payableBalance }, 'Payment voided and payable balance updated');
});

module.exports = { getSupplierPayments, getSupplierPayment, createSupplierPayment, updateSupplierPayment, deleteSupplierPayment };
