const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const Shop = require('../models/Shop');
const Entry = require('../models/Entry');
const Payment = require('../models/Payment');
const LedgerTransaction = require('../models/LedgerTransaction');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

// @route GET /api/reports/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    todaySalesAgg,
    todayPaymentsAgg,
    outstandingAgg,
    payableAgg,
    activeShops,
    todayEntriesCount,
    todayQtyAgg,
    recentTransactions,
    priorityOutstandingShops,
  ] = await Promise.all([
    Entry.aggregate([
      { $match: { status: 'active', date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'active', paymentDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Shop.aggregate([
      { $match: { isDeleted: false, currentBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } },
    ]),
    Shop.aggregate([
      { $match: { isDeleted: false, partyType: { $in: ['supplier', 'both'] }, payableBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$payableBalance' } } },
    ]),
    Shop.countDocuments({ isDeleted: false, status: { $ne: 'archived' } }),
    Entry.countDocuments({ status: 'active', date: { $gte: todayStart, $lte: todayEnd } }),
    Entry.aggregate([
      { $match: { status: 'active', date: { $gte: todayStart, $lte: todayEnd } } },
      { $unwind: '$items' },
      { $group: { _id: null, totalQty: { $sum: '$items.quantity' } } },
    ]),
    LedgerTransaction.find({ voided: false }).populate('shopId', 'name').sort('-date -createdAt').limit(10),
    Shop.find({ isDeleted: false, currentBalance: { $gt: 0 } }).sort('-currentBalance').limit(8),
  ]);

  const todaySales = todaySalesAgg[0]?.total || 0;
  const todayPending = todaySales - (todayPaymentsAgg[0]?.total || 0);

  return success(res, {
    todaySales,
    todayPayments: todayPaymentsAgg[0]?.total || 0,
    outstandingBalance: outstandingAgg[0]?.total || 0,
    totalPayable: payableAgg[0]?.total || 0,
    activeShops,
    todayEntries: todayEntriesCount,
    todayQuantity: todayQtyAgg[0]?.totalQty || 0,
    todayPending: todayPending > 0 ? todayPending : 0,
    recentTransactions,
    priorityOutstandingShops,
  }, 'Dashboard data fetched successfully');
});

// @route GET /api/reports/sales?range=today|week|month&from=&to=
const getSalesReport = asyncHandler(async (req, res) => {
  const { range, from, to } = req.query;
  let start;
  const end = endOfDay(new Date());

  if (from && to) {
    start = startOfDay(new Date(from));
  } else if (range === 'week') start = startOfWeek();
  else if (range === 'month') start = startOfMonth();
  else start = startOfDay();

  const rangeEnd = to ? endOfDay(new Date(to)) : end;

  const [summary, trend] = await Promise.all([
    Entry.aggregate([
      { $match: { status: 'active', date: { $gte: start, $lte: rangeEnd } } },
      { $group: { _id: null, totalSales: { $sum: '$total' }, entryCount: { $sum: 1 } } },
    ]),
    Entry.aggregate([
      { $match: { status: 'active', date: { $gte: start, $lte: rangeEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const days = Math.max(1, Math.ceil((rangeEnd - start) / (1000 * 60 * 60 * 24)));
  const totalSales = summary[0]?.totalSales || 0;

  return success(res, {
    totalSales,
    entryCount: summary[0]?.entryCount || 0,
    averageDailySales: Math.round((totalSales / days) * 100) / 100,
    trend: trend.map((t) => ({ date: t._id, total: t.total })),
  }, 'Sales report fetched successfully');
});

// @route GET /api/reports/payments?range=&from=&to=
const getPaymentsReport = asyncHandler(async (req, res) => {
  const { range, from, to } = req.query;
  let start;
  if (from && to) start = startOfDay(new Date(from));
  else if (range === 'week') start = startOfWeek();
  else if (range === 'month') start = startOfMonth();
  else start = startOfDay();
  const rangeEnd = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const [byMethod, total] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'active', paymentDate: { $gte: start, $lte: rangeEnd } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'active', paymentDate: { $gte: start, $lte: rangeEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return success(res, {
    totalReceived: total[0]?.total || 0,
    byMethod: byMethod.map((m) => ({ method: m._id, total: m.total, count: m.count })),
  }, 'Payments report fetched successfully');
});

// @route GET /api/reports/outstanding
const getOutstandingReport = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ isDeleted: false, currentBalance: { $gt: 0 } })
    .select('name phone currentBalance status')
    .sort('-currentBalance');

  const totalOutstanding = shops.reduce((sum, s) => sum + s.currentBalance, 0);
  const collectionRateAgg = await Promise.all([
    Entry.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Payment.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const totalBilled = collectionRateAgg[0][0]?.total || 0;
  const totalCollected = collectionRateAgg[1][0]?.total || 0;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 10000) / 100 : 0;

  return success(res, {
    shops,
    totalOutstanding,
    collectionRate,
  }, 'Outstanding report fetched successfully');
});

// @route GET /api/reports/top-shops?limit=
const getTopShops = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
  const topShops = await Entry.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$shopId', totalPurchases: { $sum: '$total' }, entryCount: { $sum: 1 } } },
    { $sort: { totalPurchases: -1 } },
    { $limit: limit },
    { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shop' } },
    { $unwind: '$shop' },
    { $project: { shopName: '$shop.name', totalPurchases: 1, entryCount: 1, currentBalance: '$shop.currentBalance' } },
  ]);
  return success(res, topShops, 'Top shops fetched successfully');
});

// @route GET /api/reports/top-products?limit=
const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
  const topProducts = await Entry.aggregate([
    { $match: { status: 'active' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.productName', totalQuantity: { $sum: '$items.quantity' }, totalAmount: { $sum: '$items.amount' } } },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
  ]);
  return success(res, topProducts.map((p) => ({ productName: p._id, totalQuantity: p.totalQuantity, totalAmount: p.totalAmount })), 'Top products fetched successfully');
});

module.exports = { getDashboard, getSalesReport, getPaymentsReport, getOutstandingReport, getTopShops, getTopProducts };
