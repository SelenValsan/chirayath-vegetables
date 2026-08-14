const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const PurchaseEntry = require('../models/PurchaseEntry');
const Shop = require('../models/Shop');
const SupplierPayment = require('../models/SupplierPayment');
const {
  createLedgerEntry, voidLedgerEntryByReference, updateLedgerEntryByReference, recalculatePayableBalance,
} = require('../services/supplierLedgerService');

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
      quantity, unit: item.unit || 'kg', rate, amount,
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

const getPurchases = asyncHandler(async (req, res) => {
  const { shopId, from, to, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (shopId) filter.shopId = shopId;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [purchases, total] = await Promise.all([
    PurchaseEntry.find(filter).populate('shopId', 'name phone').sort('-date').skip((pageNum - 1) * limitNum).limit(limitNum),
    PurchaseEntry.countDocuments(filter),
  ]);

  return success(res, purchases, 'Purchases fetched successfully', 200, {
    page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
  });
});

const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await PurchaseEntry.findById(req.params.id).populate('shopId', 'name phone payableBalance');
  if (!purchase) throw new ApiError('Purchase not found', 404);
  return success(res, purchase, 'Purchase fetched successfully');
});

const createPurchase = asyncHandler(async (req, res) => {
  const { shopId, items, discount, additionalCharges, amountPaid, date, notes } = req.body;

  const supplier = await Shop.findOne({ _id: shopId, isDeleted: false });
  if (!supplier) throw new ApiError('Supplier not found', 404);
  if (!['supplier', 'both'].includes(supplier.partyType)) {
    throw new ApiError('This business is not marked as a Supplier. Edit it and set Business Type to Supplier or Customer & Supplier first.', 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('Purchase must contain at least one product', 400);
  }

  const { cleanItems, subtotal, total } = computeTotals(items, discount, additionalCharges);
  const previousBalance = supplier.payableBalance;
  const paidNow = Number(amountPaid) || 0;
  if (paidNow < 0) throw new ApiError('Amount paid cannot be negative', 400);
  const remainingBalance = Math.round((previousBalance + total - paidNow) * 100) / 100;
  const purchaseDate = date ? new Date(date) : new Date();

  const purchase = await PurchaseEntry.create({
    shopId, items: cleanItems, subtotal,
    discount: Number(discount) || 0,
    additionalCharges: Number(additionalCharges) || 0,
    total, previousBalance, amountPaid: paidNow, remainingBalance,
    date: purchaseDate, notes: notes || '',
    createdBy: req.user._id, updatedBy: req.user._id,
  });

  await createLedgerEntry({
    shopId, type: 'purchase', debit: total, credit: 0,
    referenceId: purchase._id, referenceType: 'PurchaseEntry',
    description: `Vegetable purchase (${cleanItems.length} item${cleanItems.length > 1 ? 's' : ''})`,
    date: purchaseDate, createdBy: req.user._id,
  });

  let payment = null;
  if (paidNow > 0) {
    payment = await SupplierPayment.create({
      shopId, amount: paidNow, direction: 'paid',
      paymentMethod: req.body.paymentMethod || 'Cash',
      paymentDate: purchaseDate, referenceNumber: req.body.referenceNumber || '',
      notes: 'Paid at time of purchase', source: 'purchase',
      createdBy: req.user._id, updatedBy: req.user._id,
    });
    purchase.paymentId = payment._id;
    await purchase.save();

    await createLedgerEntry({
      shopId, type: 'payment', debit: 0, credit: paidNow,
      referenceId: payment._id, referenceType: 'SupplierPayment',
      description: 'Payment made with purchase',
      date: purchaseDate, createdBy: req.user._id,
    });
  }

  await recalculatePayableBalance(shopId);
  const updatedSupplier = await Shop.findById(shopId);

  return success(res, { purchase, payment, payableBalance: updatedSupplier.payableBalance }, 'Purchase saved successfully', 201);
});

const updatePurchase = asyncHandler(async (req, res) => {
  const purchase = await PurchaseEntry.findById(req.params.id);
  if (!purchase) throw new ApiError('Purchase not found', 404);
  if (purchase.status === 'voided') throw new ApiError('Cannot edit a voided purchase', 400);

  const { items, discount, additionalCharges, amountPaid, date, notes } = req.body;
  const { cleanItems, subtotal, total } = computeTotals(
    items || purchase.items,
    discount !== undefined ? discount : purchase.discount,
    additionalCharges !== undefined ? additionalCharges : purchase.additionalCharges
  );

  const purchaseDate = date ? new Date(date) : purchase.date;
  const paidNow = amountPaid !== undefined ? Number(amountPaid) : purchase.amountPaid;
  if (paidNow < 0) throw new ApiError('Amount paid cannot be negative', 400);

  purchase.items = cleanItems;
  purchase.subtotal = subtotal;
  purchase.discount = discount !== undefined ? Number(discount) : purchase.discount;
  purchase.additionalCharges = additionalCharges !== undefined ? Number(additionalCharges) : purchase.additionalCharges;
  purchase.total = total;
  purchase.date = purchaseDate;
  purchase.notes = notes !== undefined ? notes : purchase.notes;
  purchase.remainingBalance = Math.round((purchase.previousBalance + total - paidNow) * 100) / 100;
  purchase.updatedBy = req.user._id;

  if (purchase.paymentId && paidNow !== purchase.amountPaid) {
    if (paidNow > 0) {
      await SupplierPayment.findByIdAndUpdate(purchase.paymentId, { amount: paidNow, paymentDate: purchaseDate, updatedBy: req.user._id });
      await updateLedgerEntryByReference(purchase.paymentId, 'SupplierPayment', { credit: paidNow, date: purchaseDate });
    } else {
      await SupplierPayment.findByIdAndUpdate(purchase.paymentId, { status: 'voided', voidedAt: new Date() });
      await voidLedgerEntryByReference(purchase.paymentId, 'SupplierPayment');
    }
  } else if (!purchase.paymentId && paidNow > 0) {
    const payment = await SupplierPayment.create({
      shopId: purchase.shopId, amount: paidNow, direction: 'paid',
      paymentMethod: req.body.paymentMethod || 'Cash', paymentDate: purchaseDate,
      source: 'purchase', notes: 'Paid at time of purchase (added on edit)',
      createdBy: req.user._id, updatedBy: req.user._id,
    });
    purchase.paymentId = payment._id;
    await createLedgerEntry({
      shopId: purchase.shopId, type: 'payment', credit: paidNow,
      referenceId: payment._id, referenceType: 'SupplierPayment',
      description: 'Payment made with purchase', date: purchaseDate, createdBy: req.user._id,
    });
  }

  purchase.amountPaid = paidNow;
  await purchase.save();

  await updateLedgerEntryByReference(purchase._id, 'PurchaseEntry', {
    debit: total,
    description: `Vegetable purchase (${cleanItems.length} item${cleanItems.length > 1 ? 's' : ''}) - edited`,
    date: purchaseDate,
  });

  await recalculatePayableBalance(purchase.shopId);
  const supplier = await Shop.findById(purchase.shopId);

  return success(res, { purchase, payableBalance: supplier.payableBalance }, 'Purchase updated successfully');
});

const deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await PurchaseEntry.findById(req.params.id);
  if (!purchase) throw new ApiError('Purchase not found', 404);
  if (purchase.status === 'voided') throw new ApiError('Purchase is already voided', 400);

  purchase.status = 'voided';
  purchase.voidedAt = new Date();
  purchase.voidReason = req.body.reason || '';
  purchase.updatedBy = req.user._id;
  await purchase.save();

  await voidLedgerEntryByReference(purchase._id, 'PurchaseEntry');

  if (purchase.paymentId) {
    await SupplierPayment.findByIdAndUpdate(purchase.paymentId, { status: 'voided', voidedAt: new Date() });
    await voidLedgerEntryByReference(purchase.paymentId, 'SupplierPayment');
  }

  await recalculatePayableBalance(purchase.shopId);
  const supplier = await Shop.findById(purchase.shopId);

  return success(res, { purchase, payableBalance: supplier.payableBalance }, 'Purchase voided and payable balance updated');
});

module.exports = { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase };
