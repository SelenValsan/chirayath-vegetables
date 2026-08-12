const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Entry = require('../models/Entry');
const Shop = require('../models/Shop');
const Payment = require('../models/Payment');
const {
  createLedgerEntry,
  voidLedgerEntryByReference,
  updateLedgerEntryByReference,
  recalculateShopBalance,
} = require('../services/ledgerService');
const { createEntryReceipt, voidReceiptByReference } = require('../services/receiptService');

// Recomputes item amounts and totals server-side. Never trusts frontend-sent totals.
function computeTotals(items, discount, additionalCharges) {
  const cleanItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    if (!item.productName || !item.productName.trim()) {
      throw new ApiError('Every item requires a product name', 400);
    }
    if (!(quantity > 0)) throw new ApiError(`Quantity for "${item.productName}" must be greater than 0`, 400);
    if (!(rate >= 0)) throw new ApiError(`Rate for "${item.productName}" cannot be negative`, 400);

    const amount = Math.round(quantity * rate * 100) / 100;
    return {
      productId: item.productId || undefined,
      productName: item.productName.trim(),
      quantity,
      unit: item.unit || 'kg',
      rate,
      amount,
    };
  });

  const subtotal = Math.round(cleanItems.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
  const disc = Number(discount) || 0;
  const charges = Number(additionalCharges) || 0;
  if (disc < 0) throw new ApiError('Discount cannot be negative', 400);
  if (charges < 0) throw new ApiError('Additional charges cannot be negative', 400);

  const total = Math.round((subtotal - disc + charges) * 100) / 100;
  if (total < 0) throw new ApiError('Grand total cannot be negative - check discount amount', 400);

  return { cleanItems, subtotal, total };
}

// @route GET /api/entries?shopId=&from=&to=&page=&limit=
const getEntries = asyncHandler(async (req, res) => {
  const { shopId, from, to, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (shopId) filter.shopId = shopId;
  if (status) filter.status = status;
  else filter.status = { $ne: 'voided_hidden_placeholder' }; // show both active & voided by default
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [entries, total] = await Promise.all([
    Entry.find(filter).populate('shopId', 'name phone').sort('-date').skip((pageNum - 1) * limitNum).limit(limitNum),
    Entry.countDocuments(filter),
  ]);

  return success(res, entries, 'Entries fetched successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getEntry = asyncHandler(async (req, res) => {
  const entry = await Entry.findById(req.params.id).populate('shopId', 'name phone currentBalance');
  if (!entry) throw new ApiError('Entry not found', 404);
  return success(res, entry, 'Entry fetched successfully');
});

// @route POST /api/entries
const createEntry = asyncHandler(async (req, res) => {
  const { shopId, items, discount, additionalCharges, amountPaid, date, notes } = req.body;

  const shop = await Shop.findOne({ _id: shopId, isDeleted: false });
  if (!shop) throw new ApiError('Shop not found', 404);
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('Entry must contain at least one product', 400);
  }

  const { cleanItems, subtotal, total } = computeTotals(items, discount, additionalCharges);
  const previousBalance = shop.currentBalance;
  const paidNow = Number(amountPaid) || 0;
  if (paidNow < 0) throw new ApiError('Amount paid cannot be negative', 400);
  const remainingBalance = Math.round((previousBalance + total - paidNow) * 100) / 100;
  const entryDate = date ? new Date(date) : new Date();

  const entry = await Entry.create({
    shopId,
    items: cleanItems,
    subtotal,
    discount: Number(discount) || 0,
    additionalCharges: Number(additionalCharges) || 0,
    total,
    previousBalance,
    amountPaid: paidNow,
    remainingBalance,
    date: entryDate,
    notes: notes || '',
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createLedgerEntry({
    shopId,
    type: 'sale',
    debit: total,
    credit: 0,
    referenceId: entry._id,
    referenceType: 'Entry',
    description: `Vegetable supply (${cleanItems.length} item${cleanItems.length > 1 ? 's' : ''})`,
    date: entryDate,
    createdBy: req.user._id,
  });

  let payment = null;
  if (paidNow > 0) {
    payment = await Payment.create({
      shopId,
      amount: paidNow,
      paymentMethod: req.body.paymentMethod || 'Cash',
      paymentDate: entryDate,
      referenceNumber: req.body.referenceNumber || '',
      notes: 'Paid at time of supply entry',
      source: 'entry',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    entry.paymentId = payment._id;
    await entry.save();

    await createLedgerEntry({
      shopId,
      type: 'payment',
      debit: 0,
      credit: paidNow,
      referenceId: payment._id,
      referenceType: 'Payment',
      description: 'Payment received with supply entry',
      date: entryDate,
      createdBy: req.user._id,
    });
  }

  await recalculateShopBalance(shopId);
  const updatedShop = await Shop.findById(shopId);
  const receipt = await createEntryReceipt({ shop: updatedShop, entry, createdBy: req.user._id });

  return success(res, { entry, payment, receipt, shopBalance: updatedShop.currentBalance }, 'Entry saved successfully', 201);
});

// @route PUT /api/entries/:id
const updateEntry = asyncHandler(async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  if (!entry) throw new ApiError('Entry not found', 404);
  if (entry.status === 'voided') throw new ApiError('Cannot edit a voided entry', 400);

  const { items, discount, additionalCharges, amountPaid, date, notes } = req.body;
  const { cleanItems, subtotal, total } = computeTotals(
    items || entry.items,
    discount !== undefined ? discount : entry.discount,
    additionalCharges !== undefined ? additionalCharges : entry.additionalCharges
  );

  const entryDate = date ? new Date(date) : entry.date;
  const paidNow = amountPaid !== undefined ? Number(amountPaid) : entry.amountPaid;
  if (paidNow < 0) throw new ApiError('Amount paid cannot be negative', 400);

  entry.items = cleanItems;
  entry.subtotal = subtotal;
  entry.discount = discount !== undefined ? Number(discount) : entry.discount;
  entry.additionalCharges = additionalCharges !== undefined ? Number(additionalCharges) : entry.additionalCharges;
  entry.total = total;
  entry.date = entryDate;
  entry.notes = notes !== undefined ? notes : entry.notes;
  entry.remainingBalance = Math.round((entry.previousBalance + total - paidNow) * 100) / 100;
  entry.updatedBy = req.user._id;

  // Keep the linked payment (if any) consistent with the new amountPaid value
  if (entry.paymentId && paidNow !== entry.amountPaid) {
    if (paidNow > 0) {
      await Payment.findByIdAndUpdate(entry.paymentId, { amount: paidNow, paymentDate: entryDate, updatedBy: req.user._id });
      await updateLedgerEntryByReference(entry.paymentId, 'Payment', { credit: paidNow, date: entryDate });
    } else {
      await Payment.findByIdAndUpdate(entry.paymentId, { status: 'voided', voidedAt: new Date() });
      await voidLedgerEntryByReference(entry.paymentId, 'Payment');
    }
  } else if (!entry.paymentId && paidNow > 0) {
    const payment = await Payment.create({
      shopId: entry.shopId,
      amount: paidNow,
      paymentMethod: req.body.paymentMethod || 'Cash',
      paymentDate: entryDate,
      source: 'entry',
      notes: 'Paid at time of supply entry (added on edit)',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    entry.paymentId = payment._id;
    await createLedgerEntry({
      shopId: entry.shopId,
      type: 'payment',
      credit: paidNow,
      referenceId: payment._id,
      referenceType: 'Payment',
      description: 'Payment received with supply entry',
      date: entryDate,
      createdBy: req.user._id,
    });
  }

  entry.amountPaid = paidNow;
  await entry.save();

  await updateLedgerEntryByReference(entry._id, 'Entry', {
    debit: total,
    description: `Vegetable supply (${cleanItems.length} item${cleanItems.length > 1 ? 's' : ''}) - edited`,
    date: entryDate,
  });

  await recalculateShopBalance(entry.shopId);
  const shop = await Shop.findById(entry.shopId);

  return success(res, { entry, shopBalance: shop.currentBalance }, 'Entry updated successfully');
});

// @route DELETE /api/entries/:id  (void, not hard delete)
const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  if (!entry) throw new ApiError('Entry not found', 404);
  if (entry.status === 'voided') throw new ApiError('Entry is already voided', 400);

  entry.status = 'voided';
  entry.voidedAt = new Date();
  entry.voidReason = req.body.reason || '';
  entry.updatedBy = req.user._id;
  await entry.save();

  await voidLedgerEntryByReference(entry._id, 'Entry');
  await voidReceiptByReference(entry._id, 'entryId');

  if (entry.paymentId) {
    await Payment.findByIdAndUpdate(entry.paymentId, { status: 'voided', voidedAt: new Date() });
    await voidLedgerEntryByReference(entry.paymentId, 'Payment');
    await voidReceiptByReference(entry.paymentId, 'paymentId');
  }

  await recalculateShopBalance(entry.shopId);
  const shop = await Shop.findById(entry.shopId);

  return success(res, { entry, shopBalance: shop.currentBalance }, 'Entry voided and shop balance updated');
});

module.exports = { getEntries, getEntry, createEntry, updateEntry, deleteEntry };
