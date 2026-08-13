const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Shop = require('../models/Shop');
const Entry = require('../models/Entry');
const Payment = require('../models/Payment');
const LedgerTransaction = require('../models/LedgerTransaction');
const Receipt = require('../models/Receipt');
const { createLedgerEntry, recalculateShopBalance } = require('../services/ledgerService');

// @route GET /api/shops?search=&status=&page=&limit=&sort=
const getShops = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const filter = { isDeleted: false };

  if (status && status !== 'all') {
    if (status === 'pending') filter.currentBalance = { $gt: 0 };
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

  const [shops, total] = await Promise.all([
    Shop.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
    Shop.countDocuments(filter),
  ]);

  return success(res, shops, 'Shops fetched successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

// @route GET /api/shops/:id
const getShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.params.id, isDeleted: false });
  if (!shop) throw new ApiError('Shop not found', 404);

  const [totalPurchases, totalPaid, lastEntry, lastPayment] = await Promise.all([
    Entry.aggregate([
      { $match: { shopId: shop._id, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Payment.aggregate([
      { $match: { shopId: shop._id, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Entry.findOne({ shopId: shop._id, status: 'active' }).sort('-date'),
    Payment.findOne({ shopId: shop._id, status: 'active' }).sort('-paymentDate'),
  ]);

  return success(res, {
    shop,
    summary: {
      totalPurchases: totalPurchases[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      currentBalance: shop.currentBalance,
      lastEntryDate: lastEntry?.date || null,
      lastPaymentDate: lastPayment?.paymentDate || null,
    },
  }, 'Shop fetched successfully');
});

// @route POST /api/shops
const createShop = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) throw new ApiError('Shop name is required', 400);
  if (!phone || !phone.trim()) throw new ApiError('Phone number is required', 400);

  const openingBalance = Number(req.body.openingBalance) || 0;

  const shop = await Shop.create({
    ...req.body,
    openingBalance,
    currentBalance: openingBalance,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  if (openingBalance !== 0) {
    await createLedgerEntry({
      shopId: shop._id,
      type: 'opening_balance',
      debit: openingBalance > 0 ? openingBalance : 0,
      credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      referenceId: shop._id,
      referenceType: 'Shop',
      description: 'Opening balance',
      date: shop.createdAt,
      createdBy: req.user._id,
    });
    await recalculateShopBalance(shop._id);
  }

  return success(res, shop, 'Shop created successfully', 201);
});

// @route PUT /api/shops/:id
const updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.params.id, isDeleted: false });
  if (!shop) throw new ApiError('Shop not found', 404);

  const editable = ['name', 'ownerName', 'phone', 'alternatePhone', 'email', 'address', 'location', 'paymentPreference', 'notes', 'status'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) shop[field] = req.body[field];
  });

  // Opening balance can be edited after creation. Its financial effect lives entirely
  // in a single 'opening_balance' ledger transaction - update it (or create it if this
  // shop never had one, e.g. it started at 0) and let recalculation handle the rest.
  if (req.body.openingBalance !== undefined) {
    const newOpeningBalance = Number(req.body.openingBalance) || 0;
    if (newOpeningBalance !== shop.openingBalance) {
      shop.openingBalance = newOpeningBalance;
      const debit = newOpeningBalance > 0 ? newOpeningBalance : 0;
      const credit = newOpeningBalance < 0 ? Math.abs(newOpeningBalance) : 0;

      const existing = await LedgerTransaction.findOne({
        shopId: shop._id,
        type: 'opening_balance',
        referenceType: 'Shop',
        voided: false,
      });

      if (existing) {
        existing.debit = debit;
        existing.credit = credit;
        await existing.save();
      } else {
        await createLedgerEntry({
          shopId: shop._id,
          type: 'opening_balance',
          debit,
          credit,
          referenceId: shop._id,
          referenceType: 'Shop',
          description: 'Opening balance (edited)',
          date: shop.createdAt,
          createdBy: req.user._id,
        });
      }
    }
  }

  shop.updatedBy = req.user._id;
  await shop.save();

  if (req.body.openingBalance !== undefined) {
    await recalculateShopBalance(shop._id);
  }

  const updatedShop = await Shop.findById(shop._id);
  return success(res, updatedShop, 'Shop updated successfully');
});

// @route PATCH /api/shops/:id/status
const updateShopStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'overdue', 'archived'].includes(status)) {
    throw new ApiError('Invalid status value', 400);
  }
  const shop = await Shop.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status, updatedBy: req.user._id },
    { new: true }
  );
  if (!shop) throw new ApiError('Shop not found', 404);
  return success(res, shop, `Shop marked as ${status}`);
});

// @route DELETE /api/shops/:id
// Hard-deletes only if the shop has no financial history, otherwise archives it.
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.params.id, isDeleted: false });
  if (!shop) throw new ApiError('Shop not found', 404);

  const [entryCount, paymentCount, ledgerCount] = await Promise.all([
    Entry.countDocuments({ shopId: shop._id }),
    Payment.countDocuments({ shopId: shop._id }),
    LedgerTransaction.countDocuments({ shopId: shop._id }),
  ]);

  const hasHistory = entryCount > 0 || paymentCount > 0 || ledgerCount > 0;

  if (hasHistory) {
    shop.status = 'archived';
    shop.isDeleted = true;
    shop.deletedAt = new Date();
    shop.updatedBy = req.user._id;
    await shop.save();
    return success(res, shop, 'Shop has financial history and was archived instead of permanently deleted');
  }

  await shop.deleteOne();
  return success(res, {}, 'Shop deleted successfully');
});

// @route DELETE /api/shops/:id/permanent
// True hard delete: removes the shop AND every entry, payment, ledger transaction, and
// receipt tied to it. Irreversible. Intended for cleaning up test/demo data, not for
// removing real shops with genuine business history (use the safe delete/archive for that).
const permanentDeleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) throw new ApiError('Shop not found', 404);

  const { confirmName } = req.body;
  if (confirmName !== shop.name) {
    throw new ApiError('Shop name confirmation does not match. Type the exact shop name to confirm permanent deletion.', 400);
  }

  const [entryResult, paymentResult, ledgerResult, receiptResult] = await Promise.all([
    Entry.deleteMany({ shopId: shop._id }),
    Payment.deleteMany({ shopId: shop._id }),
    LedgerTransaction.deleteMany({ shopId: shop._id }),
    Receipt.deleteMany({ shopId: shop._id }),
  ]);

  await shop.deleteOne();

  return success(res, {
    deletedEntries: entryResult.deletedCount,
    deletedPayments: paymentResult.deletedCount,
    deletedLedgerTransactions: ledgerResult.deletedCount,
    deletedReceipts: receiptResult.deletedCount,
  }, `${shop.name} and all related records were permanently deleted`);
});

module.exports = { getShops, getShop, createShop, updateShop, updateShopStatus, deleteShop, permanentDeleteShop };
