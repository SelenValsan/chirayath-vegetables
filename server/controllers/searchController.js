const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const Shop = require('../models/Shop');
const Entry = require('../models/Entry');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');

// @route GET /api/search?q=
// Global search across shops, transactions/entries, payments, receipts, products
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return success(res, { shops: [], entries: [], payments: [], receipts: [], products: [] }, 'No query provided');

  const regex = { $regex: q, $options: 'i' };

  const [shops, products, receipts, payments] = await Promise.all([
    Shop.find({ isDeleted: false, $or: [{ name: regex }, { ownerName: regex }, { phone: regex }] }).limit(8),
    Product.find({ name: regex }).limit(8),
    Receipt.find({ receiptNumber: regex }).populate('shopId', 'name').limit(8),
    Payment.find({ referenceNumber: regex }).populate('shopId', 'name').limit(8),
  ]);

  const matchingShopIds = shops.map((s) => s._id);
  const entries = await Entry.find({
    $or: [{ shopId: { $in: matchingShopIds } }, { notes: regex }],
  }).populate('shopId', 'name').sort('-date').limit(8);

  return success(res, { shops, entries, payments, receipts, products }, 'Search results fetched');
});

module.exports = { globalSearch };
