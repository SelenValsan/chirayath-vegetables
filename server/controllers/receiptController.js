const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Receipt = require('../models/Receipt');

// @route GET /api/receipts?shopId=&type=&page=&limit=
const getReceipts = asyncHandler(async (req, res) => {
  const { shopId, type, entryId, paymentId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (shopId) filter.shopId = shopId;
  if (type) filter.type = type;
  if (entryId) filter.entryId = entryId;
  if (paymentId) filter.paymentId = paymentId;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [receipts, total] = await Promise.all([
    Receipt.find(filter).populate('shopId', 'name phone').sort('-createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
    Receipt.countDocuments(filter),
  ]);

  return success(res, receipts, 'Receipts fetched successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).populate('shopId', 'name phone address');
  if (!receipt) throw new ApiError('Receipt not found', 404);
  return success(res, receipt, 'Receipt fetched successfully');
});

module.exports = { getReceipts, getReceipt };
