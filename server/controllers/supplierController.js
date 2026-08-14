const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Shop = require('../models/Shop');
const PurchaseEntry = require('../models/PurchaseEntry');
const SupplierPayment = require('../models/SupplierPayment');
const SupplierLedgerTransaction = require('../models/SupplierLedgerTransaction');
const { createLedgerEntry, recalculatePayableBalance } = require('../services/supplierLedgerService');

// Suppliers are Shop documents with partyType 'supplier' or 'both'.
// This file never touches receivable-side fields (currentBalance, openingBalance)
// or the customer-side Entry/Payment/LedgerTransaction collections.

const getSuppliers = asyncHandler(async (req, res) => {
  const { search, status, sort = '-updatedAt', page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false, partyType: { $in: ['supplier', 'both'] } };

  if (status && status !== 'all') {
    if (status === 'pending') filter.payableBalance = { $gt: 0 };
    else filter.status = status;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { ownerName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [suppliers, total] = await Promise.all([
    Shop.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
    Shop.countDocuments(filter),
  ]);

  return success(res, suppliers, 'Suppliers fetched successfully', 200, {
    page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
  });
});

const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Shop.findOne({ _id: req.params.id, isDeleted: false, partyType: { $in: ['supplier', 'both'] } });
  if (!supplier) throw new ApiError('Supplier not found', 404);

  const [totalPurchases, totalPaid, lastPurchase, lastPayment] = await Promise.all([
    PurchaseEntry.aggregate([
      { $match: { shopId: supplier._id, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    SupplierPayment.aggregate([
      { $match: { shopId: supplier._id, status: 'active', direction: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    PurchaseEntry.findOne({ shopId: supplier._id, status: 'active' }).sort('-date'),
    SupplierPayment.findOne({ shopId: supplier._id, status: 'active' }).sort('-paymentDate'),
  ]);

  return success(res, {
    supplier,
    summary: {
      totalPurchases: totalPurchases[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      payableBalance: supplier.payableBalance,
      lastPurchaseDate: lastPurchase?.date || null,
      lastPaymentDate: lastPayment?.paymentDate || null,
    },
  }, 'Supplier fetched successfully');
});

// Creates a brand new business record as a supplier (or 'both'). If you want to
// mark an EXISTING shop as a supplier instead, use PUT /api/shops/:id with
// partyType in the body - do not create a duplicate here.
const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) throw new ApiError('Supplier name is required', 400);
  if (!phone || !phone.trim()) throw new ApiError('Phone number is required', 400);

  const partyType = req.body.partyType === 'both' ? 'both' : 'supplier';
  const payableOpeningBalance = Number(req.body.payableOpeningBalance) || 0;

  const supplier = await Shop.create({
    ...req.body,
    partyType,
    payableOpeningBalance,
    payableBalance: 0,
    openingBalance: 0,
    currentBalance: 0,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  if (payableOpeningBalance !== 0) {
    await createLedgerEntry({
      shopId: supplier._id,
      type: 'opening_balance',
      debit: payableOpeningBalance > 0 ? payableOpeningBalance : 0,
      credit: payableOpeningBalance < 0 ? Math.abs(payableOpeningBalance) : 0,
      referenceId: supplier._id,
      referenceType: 'Shop',
      description: 'Opening balance (payable)',
      date: supplier.createdAt,
      createdBy: req.user._id,
    });
    await recalculatePayableBalance(supplier._id);
  }

  const fresh = await Shop.findById(supplier._id);
  return success(res, fresh, 'Supplier added successfully', 201);
});

// Edits the payable-specific fields of an existing business (payableOpeningBalance,
// supplier status). For name/phone/address/etc, the existing PUT /api/shops/:id
// endpoint already handles it since it's the same document - this exists mainly
// for the payable opening balance, which is supplier-context-specific.
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Shop.findOne({ _id: req.params.id, isDeleted: false });
  if (!supplier) throw new ApiError('Supplier not found', 404);

  const editable = ['name', 'ownerName', 'phone', 'alternatePhone', 'email', 'address', 'location', 'paymentPreference', 'notes', 'status', 'partyType'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) supplier[field] = req.body[field];
  });

  if (req.body.payableOpeningBalance !== undefined) {
    const newPayableOpening = Number(req.body.payableOpeningBalance) || 0;
    if (newPayableOpening !== supplier.payableOpeningBalance) {
      supplier.payableOpeningBalance = newPayableOpening;
      const debit = newPayableOpening > 0 ? newPayableOpening : 0;
      const credit = newPayableOpening < 0 ? Math.abs(newPayableOpening) : 0;

      const existing = await SupplierLedgerTransaction.findOne({
        shopId: supplier._id, type: 'opening_balance', referenceType: 'Shop', voided: false,
      });

      if (existing) {
        existing.debit = debit;
        existing.credit = credit;
        await existing.save();
      } else {
        await createLedgerEntry({
          shopId: supplier._id,
          type: 'opening_balance',
          debit, credit,
          referenceId: supplier._id,
          referenceType: 'Shop',
          description: 'Opening balance (payable, edited)',
          date: supplier.createdAt,
          createdBy: req.user._id,
        });
      }
    }
  }

  supplier.updatedBy = req.user._id;
  await supplier.save();

  if (req.body.payableOpeningBalance !== undefined) {
    await recalculatePayableBalance(supplier._id);
  }

  const updated = await Shop.findById(supplier._id);
  return success(res, updated, 'Supplier updated successfully');
});

// Removes the supplier role from a business. If it's ALSO a customer ('both'),
// it simply reverts to 'customer' and stays fully intact on the Shops page -
// the purchase-side data is preserved (not deleted), it just stops being
// classified as a supplier. If it was 'supplier'-only, it's archived the same
// safe way Shops are (only hard-deleted if it has zero history anywhere).
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Shop.findOne({ _id: req.params.id, isDeleted: false, partyType: { $in: ['supplier', 'both'] } });
  if (!supplier) throw new ApiError('Supplier not found', 404);

  if (supplier.partyType === 'both') {
    supplier.partyType = 'customer';
    supplier.updatedBy = req.user._id;
    await supplier.save();
    return success(res, supplier, 'Supplier role removed - this business remains as a customer with its history intact');
  }

  const [purchaseCount, paymentCount, ledgerCount, entryCount, receivablePaymentCount] = await Promise.all([
    PurchaseEntry.countDocuments({ shopId: supplier._id }),
    SupplierPayment.countDocuments({ shopId: supplier._id }),
    SupplierLedgerTransaction.countDocuments({ shopId: supplier._id }),
    require('../models/Entry').countDocuments({ shopId: supplier._id }),
    require('../models/Payment').countDocuments({ shopId: supplier._id }),
  ]);

  const hasAnyHistory = purchaseCount > 0 || paymentCount > 0 || ledgerCount > 0 || entryCount > 0 || receivablePaymentCount > 0;

  if (hasAnyHistory) {
    supplier.status = 'archived';
    supplier.isDeleted = true;
    supplier.deletedAt = new Date();
    supplier.updatedBy = req.user._id;
    await supplier.save();
    return success(res, supplier, 'Supplier has financial history and was archived instead of permanently deleted');
  }

  await supplier.deleteOne();
  return success(res, {}, 'Supplier deleted successfully');
});

// True hard delete of purchase-side data. Never touches Entry/Payment/LedgerTransaction
// (the customer side). Only deletes the Shop document itself if it has zero
// customer-side history either - otherwise it just clears the supplier role
// and purchase data, keeping the shop intact as a customer.
const permanentDeleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Shop.findOne({ _id: req.params.id, partyType: { $in: ['supplier', 'both'] } });
  if (!supplier) throw new ApiError('Supplier not found', 404);

  const { confirmName } = req.body;
  if (confirmName !== supplier.name) {
    throw new ApiError('Supplier name confirmation does not match. Type the exact supplier name to confirm permanent deletion.', 400);
  }

  await Promise.all([
    PurchaseEntry.deleteMany({ shopId: supplier._id }),
    SupplierPayment.deleteMany({ shopId: supplier._id }),
    SupplierLedgerTransaction.deleteMany({ shopId: supplier._id }),
  ]);

  const Entry = require('../models/Entry');
  const Payment = require('../models/Payment');
  const [entryCount, receivablePaymentCount] = await Promise.all([
    Entry.countDocuments({ shopId: supplier._id }),
    Payment.countDocuments({ shopId: supplier._id }),
  ]);

  if (entryCount === 0 && receivablePaymentCount === 0) {
    await supplier.deleteOne();
    return success(res, {}, `${supplier.name} and all purchase records were permanently deleted`);
  }

  supplier.partyType = 'customer';
  supplier.payableBalance = 0;
  supplier.payableOpeningBalance = 0;
  await supplier.save();
  return success(res, supplier, `Purchase records deleted. ${supplier.name} has customer history, so it was kept as a customer.`);
});

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, permanentDeleteSupplier };
