const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const Product = require('../models/Product');
const Entry = require('../models/Entry');

// @route GET /api/products?search=&status=
const getProducts = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const products = await Product.find(filter).sort('name');
  return success(res, products, 'Products fetched successfully');
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found', 404);
  return success(res, product, 'Product fetched successfully');
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, defaultUnit, defaultRate } = req.body;
  if (!name || !name.trim()) throw new ApiError('Product name is required', 400);

  const existing = await Product.findOne({ name: name.trim() });
  if (existing) throw new ApiError('A product with this name already exists', 409);

  const product = await Product.create({
    name: name.trim(),
    defaultUnit: defaultUnit || 'kg',
    defaultRate: Number(defaultRate) || 0,
  });
  return success(res, product, 'Product added successfully', 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found', 404);

  ['name', 'defaultUnit', 'defaultRate', 'status'].forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });
  await product.save();
  return success(res, product, 'Product updated successfully');
});

// Archives instead of deleting if the product has been used in any entry
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found', 404);

  const usedCount = await Entry.countDocuments({ 'items.productId': product._id });
  if (usedCount > 0) {
    product.status = 'archived';
    await product.save();
    return success(res, product, 'Product is used in past entries and was archived instead of deleted');
  }

  await product.deleteOne();
  return success(res, {}, 'Product deleted successfully');
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
